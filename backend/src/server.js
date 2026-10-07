const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

/**
 * MongoDB Atlas uses mongodb+srv:// which requires DNS SRV lookups.
 * The local Node.js environment is currently using 127.0.0.1
 * as its DNS resolver, which is refusing the SRV query.
 *
 * Use reliable public DNS servers for MongoDB Atlas SRV resolution.
 */
dns.setServers(['8.8.8.8', '8.8.4.4']);

const validateEnv = require('./config/validateEnv');
validateEnv();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { sanitizeMiddleware } = require('./middleware/sanitizeMiddleware');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const goalRoutes = require('./routes/goalRoutes');
const groupGoalRoutes = require('./routes/groupGoalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB.
 *
 * The connection is also handled by the health endpoint when needed,
 * which is useful for serverless environments such as Vercel.
 */
connectDB().catch((error) => {
  console.error(
    '[Database] Initial connection failed:',
    error.message
  );
});

/* =========================
   SECURITY
========================= */

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/* =========================
   CORS
========================= */

const allowedOrigins = [
  'https://save-buddy-shm3.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // such as Postman, curl, server-to-server requests, mobile apps, etc.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(
      new AppError(
        `Origin ${origin} not allowed by CORS policy.`,
        403,
        'CORS_ERROR'
      )
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],

  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* =========================
   BODY PARSING
========================= */

app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(
  express.urlencoded({
    limit: '1mb',
    extended: true,
  })
);

/* =========================
   SANITIZATION
========================= */

app.use(sanitizeMiddleware);

/* =========================
   LOGGING
========================= */

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(
      process.env.NODE_ENV === 'production'
        ? 'combined'
        : 'dev'
    )
  );
}

/* =========================
   RATE LIMITING
========================= */

if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          'Too many requests from this IP, please try again after 15 minutes.',
      },
    },
  });

  app.use('/api', globalLimiter);
}

/* =========================
   API ROUTES
========================= */

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/goals', goalRoutes);

app.use('/api/group-goals', groupGoalRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/notifications', notificationRoutes);

/* =========================
   ROOT ROUTE
========================= */

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'SaveBuddy API is online. Use /api/health for system status.',
    version: '1.0.0',
  });
});

/* =========================
   404 HANDLER
========================= */

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Cannot ${req.method} ${req.originalUrl} on this server.`,
      404,
      'ROUTE_NOT_FOUND'
    )
  );
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   LOCAL SERVER
========================= */

let server = null;

/**
 * Vercel handles the HTTP server in production.
 *
 * Locally, start Express normally with app.listen().
 */
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test'
) {
  server = app.listen(PORT, () => {
    console.log(
      `[Server] SaveBuddy Backend running on port ${
        process.env.NODE_ENV || 'development'
      } mode.`
    );

    console.log(
      `[Server] Health check available at: http://localhost:${PORT}/api/health`
    );
  });
}

/* =========================
   PROCESS ERROR HANDLING
========================= */

process.on('unhandledRejection', (err) => {
  console.error(
    '[Process Alert] Unhandled Rejection:',
    err.message
  );
});

process.on('uncaughtException', (err) => {
  console.error(
    '[Process Alert] Uncaught Exception:',
    err.message
  );

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log(
    '[Process] SIGTERM received. Gracefully shutting down...'
  );

  if (server) {
    server.close(() => {
      console.log(
        '[Process] Server terminated gracefully.'
      );
  });
  }
});

/* =========================
   EXPORT APP
========================= */

module.exports = app;