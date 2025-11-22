import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import {
  csrfProtection,
  csrfErrorHandler,
  getCsrfToken
} from './middleware/csrf.js';

const app = express();

// Security middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://erdent.pages.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// Trust proxy for correct IP and secure cookies
app.set('trust proxy', 1);

// CSRF protection for state-changing routes
app.use('/api/auth', csrfProtection);
app.use('/api/users', csrfProtection);
app.use('/api/orders', csrfProtection);
app.use('/api/payment', csrfProtection);

// CSRF token endpoint (no CSRF protection needed)
app.get('/api/csrf-token', getCsrfToken);

// Routes
app.use('/api/auth', (await import('./routes/auth-enhanced.js')).default);
// ... other routes

// CSRF error handler
app.use(csrfErrorHandler);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Don't expose internal errors in production
  const response = process.env.NODE_ENV === 'production' ? {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  } : {
    error: error.message,
    stack: error.stack,
    code: error.code || 'INTERNAL_ERROR'
  };
  
  res.status(error.status || 500).json(response);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

export default app;
