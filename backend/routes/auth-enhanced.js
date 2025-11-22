import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  auth,
  admin,
  sanitizeInput,
  validatePasswordStrength,
  setAuthCookies,
  clearAuthCookies,
  generateSecureTokens,
  verifyTokenWithFingerprint,
  generateRequestFingerprint,
  googleLogin,
  refreshTokens,
  logout
} from '../middleware/auth-enhanced.js';
import User from '../models/User.js';

const router = express.Router();

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts',
    code: 'LOGIN_RATE_LIMIT'
  },
  skipSuccessfulRequests: true
});

// CSRF token endpoint
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Login with fingerprint
router.post('/login', loginLimiter, sanitizeInput, async (req, res) => {
  try {
    const { email, password, remember = false } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    const fingerprint = generateRequestFingerprint(req);
    const tokens = generateSecureTokens(user._id, remember, fingerprint);

    // Store refresh token
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Set secure cookies
    setAuthCookies(res, { ...tokens, remember });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified
      },
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Token refresh with fingerprint verification
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const remember = req.cookies.rememberMe === 'true';
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const fingerprint = generateRequestFingerprint(req);
    const tokens = await refreshTokens(refreshToken, remember, fingerprint);

    // Update cookies
    setAuthCookies(res, { ...tokens, remember });

    res.json({
      accessToken: tokens.accessToken,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthCookies(res);
    res.status(401).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// Logout with blacklisting
router.post('/logout', auth, async (req, res) => {
  try {
    await logout(req.cookies.accessToken, req.cookies.refreshToken, req.user.id);
    clearAuthCookies(res);
    
    res.json({ 
      message: 'Logged out successfully',
      csrfToken: req.csrfToken() // New CSRF token for next session
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if blacklisting fails
    clearAuthCookies(res);
    res.json({ 
      message: 'Logged out successfully',
      csrfToken: req.csrfToken()
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -otp')
      .lean();

    res.json({
      user: {
        ...user,
        id: user._id
      },
      rememberMe: req.cookies.rememberMe === 'true'
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user data',
      code: 'USER_FETCH_ERROR'
    });
  }
});

export default router;