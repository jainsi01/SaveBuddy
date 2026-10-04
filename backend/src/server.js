const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// 1. Load Environment Configuration
dotenv.config();

// 2. Validate Environment Variables (EC-1.1)
const validateEnv = require('./config/validateEnv');
validateEnv();

// 3. Import Database & Middleware
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 4. Initialize Database Connection (EC-1.2)
connectDB();

// 5. Global Security Headers
app.use(helmet());

// 6. Dynamic CORS Configuration (EC-1.5)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(`Origin ${origin} not allowed by CORS policy.`, 403, 'CORS_ERROR'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 7. Request Body Parsers with Size Limit (EC-1.4: max 1MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 8. HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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
        message: 'Too many requests from this IP, please try again after 15 minutes.',
      },
    },
  });
  app.use('/api', globalLimiter);
}

// 10. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SaveBuddy API is online. Use /api/health for system status.',
    version: '1.0.0',
  });
});

// 11. Handle Unmatched Routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// 12. Centralized Global Error Handler (EC-1.3, EC-1.4)
app.use(errorHandler);

// 13. Start HTTP Server (Only start listening if not running in a test suite)
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[Server] SaveBuddy Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
  });
}

// 14. Graceful Shutdown & Process Monitoring (EC-1.7)
process.on('unhandledRejection', (err) => {
  console.error('[Process Alert] Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Alert] Uncaught Exception:', err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('[Process] SIGTERM received. Gracefully shutting down...');
  if (server) {
    server.close(() => console.log('[Process] Server terminated gracefully.'));
  }
});

module.exports = app;
