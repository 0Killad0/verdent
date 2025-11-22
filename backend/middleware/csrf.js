import csurf from 'csurf';
import rateLimit from 'express-rate-limit';

// CSRF protection configuration
export const csrfProtection = csurf({
  cookie: {
    ...COOKIE_CONFIG,
    key: '_csrf',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// CSRF token endpoint
export const getCsrfToken = (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken(),
    timestamp: new Date().toISOString()
  });
};

// CSRF error handler
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  res.status(403).json({
    error: 'Invalid CSRF token',
    code: 'INVALID_CSRF_TOKEN',
    message: 'Form submission failed security verification'
  });
};