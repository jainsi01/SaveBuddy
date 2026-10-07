const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// 1. Load Environment Configuration
dotenv.config();

// 2. Validate Environment Variables
const validateEnv = require('./config/validateEnv');
validateEnv();

// 3. Import Database & Middleware
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

// Trust Vercel's reverse proxy
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// 4. Initialize Database Connection
// Vercel may invoke the function before MongoDB connection is ready.
// Catch the error so it does not become an unhandled rejection.
connectDB().catch((error) => {
  console.error(
    '[Database] Initial connection failed:',
    error.message
  );
});

// 5. Global Security Headers & Content Security Policy
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

// 6. Dynamic CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // such as mobile apps, curl, Postman, etc.
      if (!origin || allowedOrigins.includes(origin)) {
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 7. Request Body Parsers
// Maximum request size: 1MB
// NoSQL sanitization middleware
app.use(express.json({ limit: '1mb' }));
app.use(
  express.urlencoded({
    limit: '1mb',
    extended: true,
  })
);
app.use(sanitizeMiddleware);

// 8. HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(
      process.env.NODE_ENV === 'production'
        ? 'combined'
        : 'dev'
    )
  );
}

// 9. Global Rate Limiter
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

// 10. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/group-goals', groupGoalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// 11. Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'SaveBuddy API is online. Use /api/health for system status.',
    version: '1.0.0',
  });
});

// 12. Handle Unmatched Routes (404)
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Cannot ${req.method} ${req.originalUrl} on this server.`,
      404,
      'ROUTE_NOT_FOUND'
    )
  );
});

// 13. Centralized Global Error Handler
app.use(errorHandler);

// 14. Start HTTP Server
// Vercel manages the HTTP server in production.
// app.listen() is only used for local development.
let server = null;

if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test'
) {
  server = app.listen(PORT, () => {
    console.log(
      `[Server] SaveBuddy Backend running on port ${PORT} in ${
        process.env.NODE_ENV || 'development'
      } mode.`
    );

    console.log(
      `[Server] Health check available at: http://localhost:${PORT}/api/health`
    );
  });
}

// 15. Graceful Shutdown & Process Monitoring

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

// 16. Export Express App
// Required by Vercel
module.exports = app;