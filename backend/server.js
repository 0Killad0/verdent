import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Routes
import healthRoutes from './routes/health.js';
import paymentRoutes from './routes/payment.js'; // Razorpay Routes ONLY (No Stripe)

// Security fallback packages
let helmet, mongoSanitize, hpp, compression;
try {
  helmet = (await import('helmet')).default;
  mongoSanitize = (await import('express-mongo-sanitize')).default;
  hpp = (await import('hpp')).default;
  compression = (await import('compression')).default;
} catch (error) {
  console.warn('Some security packages not found. Running with basic security.');
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ======================================================
   CORS CONFIGURATION
====================================================== */
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'https://erdent.netlify.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.log('CORS Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.options('*', cors());

/* ======================================================
   BASIC SECURITY HEADERS
====================================================== */
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

app.set('trust proxy', 1);

/* ======================================================
   BODY PARSER (Stripe raw body removed)
====================================================== */
app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ======================================================
   SANITIZATION
====================================================== */
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return;

    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (key.startsWith('$')) delete obj[key];
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
});

app.use((req, res, next) => {
  const keys = Object.keys(req.query);
  if (keys.length !== [...new Set(keys)].length) {
    return res.status(400).json({ error: 'Parameter pollution detected' });
  }
  next();
});

/* ======================================================
   STATIC FILES
====================================================== */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ======================================================
   ROUTES
====================================================== */
const { authLimiter, generalAuthLimiter, sanitizeInput, auth } = await import('./middleware/auth.js');

let admin;
try {
  const authModule = await import('./middleware/auth.js');
  admin = authModule.admin;
} catch {
  admin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  };
}

app.use('/api/auth', authLimiter);
app.use('/api/', generalAuthLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/products', sanitizeInput, (await import('./routes/products.js')).default);
app.use('/api/orders', auth, sanitizeInput, (await import('./routes/orders.js')).default);
app.use('/api/users', auth, sanitizeInput, (await import('./routes/users.js')).default);
app.use('/api/upload', auth, (await import('./routes/upload.js')).default);
app.use('/api/images', (await import('./routes/images.js')).default);
app.use('/api/offers', auth, sanitizeInput, (await import('./routes/offers.js')).default);

/* ======================================================
   NEW: RAZORPAY PAYMENT ROUTES
====================================================== */
app.use('/api/payment', paymentRoutes);

/* ======================================================
   AUTH METRICS
====================================================== */
app.get('/api/auth/metrics', auth, admin, async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    let userMetrics = {};
    try {
      const User = mongoose.model('User');
      userMetrics.totalUsers = await User.countDocuments();
      userMetrics.activeUsers = await User.countDocuments({
        lastActive: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      });
    } catch {
      userMetrics.error = 'User model unavailable';
    }

    res.json({
      timestamp: new Date().toISOString(),
      system: {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
      database: {
        status: dbStatus,
        ...userMetrics
      },
      requestUser: req.user || null
    });

  } catch (err) {
    res.status(500).json({ error: 'Metrics error' });
  }
});

/* ======================================================
   GLOBAL ERRORS
====================================================== */
app.use((err, req, res, next) => {
  console.error('ERROR:', err);

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

/* ======================================================
   404 HANDLER
====================================================== */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ======================================================
   MONGO CONNECTION
====================================================== */
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');

    // Remove old bad index
    try {
      const collection = mongoose.connection.collection('users');
      const indexes = await collection.indexes();
      if (indexes.some(i => i.name === 'sessions.sessionId_1')) {
        await collection.dropIndex('sessions.sessionId_1');
        console.log('Dropped sessions index');
      }
    } catch {}
  })
  .catch(err => {
    console.error('DB ERR:', err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Razorpay enabled. Stripe removed.');
});
