// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { 
  auth, 
  authLimiter, 
  generalAuthLimiter, 
  refreshLimiter,
  sanitizeInput 
} from '../middleware/auth.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Apply general rate limiting and sanitization to all routes
router.use(generalAuthLimiter);
router.use(sanitizeInput);

/** ================================
 *  SEND EMAIL FUNCTION
 *  ================================ */
const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MarketSphere" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: message,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

/** ================================
 *  HELPERS
 *  ================================ */
const buildSafeUser = (userDoc) => ({
  _id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  avatar: userDoc.avatar,
  isVerified: userDoc.isVerified,
  createdAt: userDoc.createdAt,
});

/** ================================
 *  ENHANCED TOKEN GENERATION WITH REMEMBER ME
 *  ================================ */
const generateTokens = (userId, remember = false) => {
  const accessToken = jwt.sign(
    { 
      id: userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_SECRET, 
    {
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
      expiresIn: remember ? '7d' : '15m'
    }
  );

  const refreshToken = jwt.sign(
    { 
      id: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_REFRESH_SECRET,
    {
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
      expiresIn: remember ? '30d' : '7d'
    }
  );

  return { accessToken, refreshToken };
};

/** ================================
 *  REGISTER -> SEND OTP
 *  ================================ */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ error: 'User already exists' });
      }
      user.name = name;
      user.password = password;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        otp,
        otpExpires,
      });
    }

    try {
      await sendEmail(
        email,
        'MarketSphere Email Verification Code',
        `Hi ${name},\n\nYour OTP code is ${otp}.\nIt expires in 10 minutes.\n\n- MarketSphere Team`
      );
    } catch (mailErr) {
      console.error('Error sending OTP email:', mailErr);
    }

    return res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({ error: 'Server error while sending OTP' });
  }
});

/** ================================
 *  VERIFY OTP WITH REMEMBER ME
 *  ================================ */
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp, remember = false } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    const { accessToken, refreshToken } = generateTokens(user._id, remember);

    user.refreshToken = refreshToken;
    await user.save();

    const safeUser = buildSafeUser(user);

    return res.status(200).json({
      message: 'OTP verified successfully',
      user: safeUser,
      tokens: { 
        accessToken, 
        refreshToken,
        expiresIn: remember ? '7d' : '15m'
      },
    });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    return res.status(500).json({ error: 'Server error while verifying OTP' });
  }
});

/** ================================
 *  LOGIN WITH REMEMBER ME
 *  ================================ */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, remember = false } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, remember);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const safeUser = buildSafeUser(user);

    return res.status(200).json({
      user: safeUser,
      tokens: { 
        accessToken, 
        refreshToken,
        expiresIn: remember ? '7d' : '15m'
      },
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/** ================================
 *  GOOGLE LOGIN WITH REMEMBER ME
 *  ================================ */
router.post('/google', authLimiter, async (req, res) => {
  try {
    const token = req.body?.token || req.body?.credential || req.headers['x-id-token'];
    const remember = req.body?.remember || false;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr?.message || verifyErr);
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Google token missing email' });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || '';
    const googleId = payload.sub;
    const picture = payload.picture;

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        avatar: picture,
        password: randomPassword,
        lastLogin: new Date(),
        loginCount: 1,
      });

      await user.save();
      isNewUser = true;
    } else {
      user.googleId = user.googleId || googleId;
      user.avatar = picture || user.avatar;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.isVerified = true;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id, remember);

    await User.findByIdAndUpdate(user._id, { 
      refreshToken, 
      lastActive: new Date() 
    });

    const safeUser = buildSafeUser(user);

    return res.status(200).json({
      message: 'Google login successful',
      user: safeUser,
      tokens: { 
        accessToken, 
        refreshToken,
        expiresIn: remember ? '7d' : '15m'
      },
      isNewUser,
    });
  } catch (error) {
    console.error('GOOGLE LOGIN ERROR:', error);
    return res.status(500).json({ error: 'Google login failed' });
  }
});

/** ================================
 *  TOKEN REFRESH ENDPOINT - FIXED
 *  ================================ */
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const { refreshToken, remember = false } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    console.log('🔐 Refresh token request received');

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        issuer: process.env.JWT_ISSUER || 'marketsphere-api',
        audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
      });
    } catch (err) {
      console.error('Refresh token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token mismatch',
        code: 'REFRESH_TOKEN_MISMATCH'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({ 
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id, remember);

    user.refreshToken = newRefreshToken;
    user.lastActive = new Date();
    await user.save();

    console.log('✅ Token refresh successful for user:', user.email);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: remember ? '7d' : '15m'
    });

  } catch (error) {
    console.error('❌ TOKEN REFRESH ERROR:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

/** ================================
 *  LOGOUT ENDPOINT
 *  ================================ */
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/** ================================
 *  FORGOT PASSWORD
 *  ================================ */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
        issuer: process.env.JWT_ISSUER || 'marketsphere-api',
        audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
      }
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      await sendEmail(
        email,
        'MarketSphere - Reset Your Password',
        `Hi ${user.name},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n- MarketSphere Team`
      );
    } catch (mailErr) {
      console.error('Error sending reset email:', mailErr);
    }

    return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return res.status(500).json({ error: 'Server error while processing request' });
  }
});

/** ================================
 *  RESET PASSWORD
 *  ================================ */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'marketsphere-api',
        audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
      });
    } catch (err) {
      console.error('Reset token verify error:', err);
      if (err.name === 'TokenExpiredError') return res.status(400).json({ error: 'Reset token has expired' });
      if (err.name === 'JsonWebTokenError') return res.status(400).json({ error: 'Invalid reset token' });
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = password;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    return res.status(500).json({ error: 'Server error while resetting password' });
  }
});

/** ================================
 *  GET CURRENT USER
 *  ================================ */
router.get('/me', auth, async (req, res) => {
  return res.status(200).json(req.user);
});

export default router;