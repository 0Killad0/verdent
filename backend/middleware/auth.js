// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import xss from 'xss';

// Load environment variables at the very top
import dotenv from 'dotenv';
dotenv.config();

// Debug environment variables
console.log('🔍 Auth Middleware - Environment Check:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? `SET (length: ${process.env.JWT_SECRET.length})` : 'NOT SET');
console.log('   JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `SET (length: ${process.env.JWT_REFRESH_SECRET.length})` : 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

// Validate required environment variables
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('\n❌ CRITICAL: JWT_SECRET & JWT_REFRESH_SECRET environment variables are required');
  console.error('   Please check your .env file and ensure these variables are set');
  process.exit(1);
}

console.log('✅ Environment variables verified successfully\n');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/** ================================
 * REDIS CONNECTION WITH FALLBACK
 * ================================ */
let redis;
let redisAvailable = false;

const initializeRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.warn('⚠️ REDIS_URL not provided, running without Redis');
      redisAvailable = false;
      return;
    }

    console.log('🔄 Initializing Redis connection...');
    
    redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      connectTimeout: 10000,
      lazyConnect: true,
      retryDelay: (times) => Math.min(times * 50, 2000),
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis connection failed after 3 attempts');
          redisAvailable = false;
          return null;
        }
        const delay = Math.min(times * 1000, 5000);
        console.log(`🔄 Retrying Redis connection in ${delay}ms... (attempt ${times})`);
        return delay;
      }
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisAvailable = true;
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      redisAvailable = false;
    });

    redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      redisAvailable = false;
    });

    redis.on('ready', () => {
      console.log('✅ Redis is ready to accept commands');
      redisAvailable = true;
    });

    // Test the connection
    await redis.ping();
    console.log('✅ Redis connection test successful');
    
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    redisAvailable = false;
    
    // Close Redis connection if it exists
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        // Ignore quit errors
      }
    }
  }
};

// Initialize Redis on startup
initializeRedis();

/** ================================
 * SECURITY CONFIGURATION
 * ================================ */
const SECURITY_CONFIG = {
  JWT: {
    access: {
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
    },
    refresh: {
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
    }
  }
};

/** ================================
 * RATE LIMITING - DEVELOPMENT FRIENDLY
 * ================================ */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 10, // Higher limit in development
  message: { 
    error: 'Too many authentication attempts, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development') {
      return req.ip === '::1' || req.ip === '127.0.0.1';
    }
    return false;
  }
});

export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 200 : 100,
  message: { 
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 30 : 15,
  message: { 
    error: 'Too many refresh attempts, please try again later',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** ================================
 * TOKEN BLACKLIST WITH GRACEFUL FALLBACK
 * ================================ */
export const addToBlacklist = async (token) => {
  if (!redisAvailable || !redis) {
    console.warn('⚠️ Redis not available, skipping blacklist');
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      // Default 5 minutes if no expiration
      await redis.set(`jwt-blacklist:${tokenHash}`, '1', 'PX', 5 * 60 * 1000);
      console.log('✅ Token blacklisted for 5 minutes (no expiration)');
      return;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const remainingTimeMs = (decoded.exp - nowInSeconds) * 1000;
    
    if (remainingTimeMs > 0) {
      await redis.set(`jwt-blacklist:${tokenHash}`, '1', 'PX', remainingTimeMs);
      console.log(`✅ Token blacklisted for ${Math.round(remainingTimeMs / 1000 / 60)} minutes`);
    }
  } catch (error) {
    console.error('❌ Error adding to blacklist:', error.message);
    // Don't throw error, just log it
  }
};

export const isTokenBlacklisted = async (token) => {
  if (!redisAvailable || !redis) {
    console.warn('⚠️ Redis not available, assuming token is not blacklisted');
    return false;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const exists = await redis.exists(`jwt-blacklist:${tokenHash}`);
    return exists === 1;
  } catch (error) {
    console.error('❌ Error checking blacklist:', error.message);
    // If Redis fails, assume token is not blacklisted to avoid blocking legitimate requests
    return false;
  }
};

/** ================================
 * TOKEN MANAGEMENT WITH REMEMBER ME
 * ================================ */
export const generateAccessToken = (userId, remember = false) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { 
      id: userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_SECRET, 
    {
      issuer: SECURITY_CONFIG.JWT.access.issuer,
      audience: SECURITY_CONFIG.JWT.access.audience,
      expiresIn: remember ? '7d' : '15m'
    }
  );
};

export const generateRefreshToken = (userId, remember = false) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(
    { 
      id: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_REFRESH_SECRET,
    {
      issuer: SECURITY_CONFIG.JWT.refresh.issuer,
      audience: SECURITY_CONFIG.JWT.refresh.audience,
      expiresIn: remember ? '30d' : '7d'
    }
  );
};

export const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh 
    ? process.env.JWT_REFRESH_SECRET
    : process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(isRefresh ? 'JWT_REFRESH_SECRET is not defined' : 'JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret, {
    issuer: SECURITY_CONFIG.JWT.access.issuer,
    audience: SECURITY_CONFIG.JWT.access.audience,
  });
};

/** ================================
 * AUTH MIDDLEWARE - FIXED WITH PROPER USER ID
 * ================================ */
export const auth = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_TOKEN',
      message: 'Please provide a valid authentication token'
    });
  }

  try {
    // Check if token is blacklisted (with graceful fallback)
    let isBlacklisted = false;
    try {
      isBlacklisted = await isTokenBlacklisted(token);
    } catch (blacklistError) {
      console.warn('⚠️ Blacklist check failed, proceeding with auth:', blacklistError.message);
      // Continue with authentication even if blacklist check fails
    }

    if (isBlacklisted) {
      console.log('❌ Auth failed: Token is blacklisted');
      return res.status(401).json({
        error: 'Token has been invalidated',
        code: 'TOKEN_INVALIDATED',
        message: 'This token is no longer valid. Please log in again.'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      console.log('❌ Auth failed: Invalid token type');
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE',
        message: 'Expected access token but received different token type'
      });
    }

    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -otp')
      .lean();

    if (!user) {
      console.log('❌ Auth failed: User not found for ID:', decoded.id);
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'The user associated with this token no longer exists'
      });
    }

    if (user.isSuspended) {
      console.log('❌ Auth failed: Account suspended');
      return res.status(403).json({
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // CRITICAL FIX: Add both _id and id for compatibility
    req.user = {
      ...user,
      id: user._id.toString(), // Add id field for compatibility
      _id: user._id
    };
    req.token = token;
    
    console.log('✅ Auth successful for user:', user.email);
    next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error?.name, error?.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid or malformed'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not yet valid',
        code: 'TOKEN_NOT_ACTIVE',
        message: 'This token is not yet valid for use'
      });
    }

    // Handle missing secret errors
    if (error.message.includes('is not defined')) {
      console.error('❌ CRITICAL: JWT secret not defined:', error.message);
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'SERVER_ERROR',
        message: 'Authentication service is temporarily unavailable'
      });
    }

    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      message: 'Unable to authenticate with the provided credentials'
    });
  }
};

/** ================================
 * OPTIONAL AUTH MIDDLEWARE
 * (Doesn't fail if no token, but adds user if available)
 * ================================ */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    // No token, but that's OK for optional auth
    return next();
  }

  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      // Token is blacklisted, but we don't fail for optional auth
      return next();
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      // Invalid token type, but we don't fail for optional auth
      return next();
    }

    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -otp')
      .lean();

    if (user && !user.isSuspended) {
      req.user = {
        ...user,
        id: user._id.toString(),
        _id: user._id
      };
      req.token = token;
    }

    next();
  } catch (error) {
    // For optional auth, we just continue without user info
    console.warn('⚠️ Optional auth failed, continuing without user:', error.message);
    next();
  }
};

/** ================================
 * ADMIN MIDDLEWARE
 * ================================ */
export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_USER',
      message: 'Please log in to access this resource'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED',
      message: 'This action requires administrator privileges'
    });
  }

  next();
};

/** ================================
 * INPUT SANITIZATION (XSS Protection)
 * ================================ */
export const sanitizeInput = (req, res, next) => {
  const deepSanitize = (obj) => {
    if (!obj) return;
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        deepSanitize(obj[key]);
      }
    }
  };

  if (req.body) deepSanitize(req.body);
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);

  next();
};

/** ================================
 * PASSWORD VALIDATION
 * ================================ */
export const validatePasswordStrength = (password) => {
  const issues = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    issues.push('Password must contain at least one special character');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/** ================================
 * GOOGLE LOGIN HELPER
 * ================================ */
export const googleLogin = async (token, remember = false) => {
  if (!token) throw new Error('Google token is required');
  
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    console.error('Google token verification failed:', error?.message);
    throw new Error('Invalid Google token');
  }

  const payload = ticket.getPayload();

  if (!payload.email_verified) throw new Error('Google email not verified');
  const { email, name, sub: googleId, picture } = payload;

  // Always try matching by email first to prevent duplicates
  let user = await User.findOne({ email: email.toLowerCase() });

  const session = await User.startSession();
  let createdUser = false;

  try {
    await session.withTransaction(async () => {
      if (!user) {
        // Try matching by googleId if not found by email
        user = await User.findOne({ googleId });
      }
      if (!user) {
        // Generate secure random password
        const randomPassword = crypto.randomBytes(32).toString('hex');
        
        user = await User.create([{
          name: name.trim(),
          email: email.toLowerCase(),
          googleId,
          isVerified: true,
          avatar: picture,
          password: randomPassword,
          lastLogin: new Date(),
          loginCount: 1
        }], { session });

        user = user[0];
        createdUser = true;
      } else {
        // Update existing user
        user.googleId = googleId;
        user.avatar = picture;
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        user.isVerified = true;

        await user.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  // Generate tokens with remember me preference
  const accessToken = generateAccessToken(user._id, remember);
  const refreshToken = generateRefreshToken(user._id, remember);

  // Store refresh token in database
  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    lastActive: new Date()
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: remember ? '7d' : '15m'
    },
    isNewUser: createdUser
  };
};

/** ================================
 * TOKEN REFRESH HELPER
 * ================================ */
export const refreshTokens = async (refreshToken, remember = false) => {
  if (!refreshToken) throw new Error('Refresh token required');
  
  const decoded = verifyToken(refreshToken, true);

  if (decoded.type !== 'refresh') throw new Error('Invalid refresh token');
  
  const user = await User.findById(decoded.id);

  if (!user) throw new Error('User not found');
  
  // Check stored refresh token matches
  if (user.refreshToken !== refreshToken) throw new Error('Refresh token mismatch');
  
  if (user.isSuspended) throw new Error('Account suspended');

  // Generate new tokens with remember me preference
  const newAccessToken = generateAccessToken(user._id, remember);
  const newRefreshToken = generateRefreshToken(user._id, remember);

  // Update refresh token in database (Rotation)
  user.refreshToken = newRefreshToken;
  user.lastActive = new Date();
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: remember ? '7d' : '15m'
  };
};

/** ================================
 * LOGOUT HELPER
 * ================================ */
export const logout = async (accessToken, refreshToken, userId) => {
  // Add access token to redis blacklist (with fallback)
  if (accessToken) {
    try {
      await addToBlacklist(accessToken);
    } catch (error) {
      console.warn('⚠️ Failed to blacklist token during logout:', error.message);
      // Continue with logout even if blacklisting fails
    }
  }

  // Clear refresh token from database if userId provided
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });
  }
};

/** ================================
 * HEALTH CHECK FOR REDIS
 * ================================ */
export const checkRedisHealth = async () => {
  if (!redis || !redisAvailable) {
    return { 
      healthy: false, 
      message: 'Redis not available',
      redisAvailable 
    };
  }

  try {
    await redis.ping();
    return { 
      healthy: true, 
      message: 'Redis is healthy',
      redisAvailable: true
    };
  } catch (error) {
    redisAvailable = false;
    return { 
      healthy: false, 
      message: error.message,
      redisAvailable: false
    };
  }
};

/** ================================
 * MANUAL REDIS RECONNECTION
 * ================================ */
export const reconnectRedis = async () => {
  try {
    if (redis) {
      await redis.quit();
    }
    await initializeRedis();
    return { success: true, message: 'Redis reconnection attempted' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/** ================================
 * MIDDLEWARE EXPORTS
 * ================================ */
export default {
  auth,
  optionalAuth,
  admin,
  authLimiter,
  generalAuthLimiter,
  refreshLimiter,
  sanitizeInput,
  validatePasswordStrength,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  addToBlacklist,
  isTokenBlacklisted,
  googleLogin,
  refreshTokens,
  logout,
  checkRedisHealth,
  reconnectRedis
};