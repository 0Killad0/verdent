import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

// Secure cookie configuration
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  domain: process.env.COOKIE_DOMAIN || 'localhost'
};

export const setAuthCookies = (res, { accessToken, refreshToken, remember = false }) => {
  const accessTokenMaxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000; // 7 days or 15 min
  const refreshTokenMaxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days

  res.cookie('accessToken', accessToken, {
    ...COOKIE_CONFIG,
    maxAge: accessTokenMaxAge
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_CONFIG,
    maxAge: refreshTokenMaxAge
  });

  res.cookie('rememberMe', remember.toString(), {
    ...COOKIE_CONFIG,
    httpOnly: false, // Needed for client-side reading
    maxAge: refreshTokenMaxAge
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_CONFIG);
  res.clearCookie('refreshToken', COOKIE_CONFIG);
  res.clearCookie('rememberMe', { ...COOKIE_CONFIG, httpOnly: false });
};

export const generateSecureTokens = (userId, remember = false, fingerprint) => {
  const accessToken = jwt.sign(
    { 
      id: userId,
      type: 'access',
      fp: fingerprint, // Token fingerprint
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: remember ? '7d' : '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      id: userId,
      type: 'refresh', 
      fp: fingerprint,
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: remember ? '30d' : '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyTokenWithFingerprint = (token, fingerprint, isRefresh = false) => {
  const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  const decoded = jwt.verify(token, secret);
  
  if (decoded.fp !== fingerprint) {
    throw new Error('Token fingerprint mismatch');
  }
  
  return decoded;
};

export const generateRequestFingerprint = (req) => {
  const components = [
    req.ip,
    req.headers['user-agent'],
    req.headers['accept-language']
  ].filter(Boolean).join('|');
  
  return crypto.createHash('sha256').update(components).digest('hex');
};