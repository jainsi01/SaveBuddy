const mongoose = require('mongoose');

/**
 * MongoDB connection manager
 *
 * Mongoose reuses an existing connection when the Vercel
 * function/container is warm, which avoids opening a new
 * database connection for every request.
 */

let connectionPromise = null;

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection is already being established
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  connectionPromise = mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then((mongooseInstance) => {
      console.log(
        `[Database] MongoDB Connected: ${mongooseInstance.connection.host}`
      );

      return mongooseInstance.connection;
    })
    .catch((error) => {
      connectionPromise = null;

      console.error(
        `[Database Error] Connection failed: ${error.message}`
      );

      throw error;
    });

  return connectionPromise;
};

// Monitor connection lifecycle
mongoose.connection.on('connected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Database Event] Mongoose connected to MongoDB.');
  }
});

mongoose.connection.on('error', (error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      `[Database Event] Mongoose connection error: ${error.message}`
    );
  }
});

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[Database Event] MongoDB disconnected.');
  }
});

module.exports = connectDB;