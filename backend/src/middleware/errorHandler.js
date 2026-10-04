/**
 * Global Centralized Error Handling Middleware (EC-1.3, EC-1.4)
 * Formats all operational and unexpected errors into a consistent response envelope.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';

  // EC-1.3: Handle Malformed JSON in Request Body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON_BODY';
    message = 'Malformed JSON payload in request body. Please verify syntax.';
  }

  // EC-1.4: Handle Request Entity Too Large
  if (err.type === 'entity.too.large' || err.status === 413) {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds the 1MB allowed limit.';
  }

  // Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_RESOURCE_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // EC-8.6: MongoDB Failover or Network Connection Error
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    statusCode = 503;
    errorCode = 'DATABASE_UNAVAILABLE';
    message = 'Database temporarily unavailable. Please retry shortly.';
  }

  // In development, log the full error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${errorCode} (${statusCode}):`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = errorHandler;
