const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * MongoDB Database Connection Manager (EC-1.2)
 * Handles connection initialization, lifecycle events, and automatic reconnection.
 */
let isConnecting = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/savebuddy';

  if (isConnecting || mongoose.connection.readyState === 1) {
    return;
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Timeout quickly instead of hanging
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[Database Error] Connection failed: ${error.message}`);
    }
    isConnecting = false;
  }
};

// Monitor Connection Lifecycle Events
mongoose.connection.on('connected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Database Event] Mongoose connected to MongoDB cluster.');
  }
});

mongoose.connection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Database Event] Mongoose connection error: ${err.message}`);
  }
});

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[Database Event] Mongoose disconnected from MongoDB. Attempting reconnection...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
});

module.exports = connectDB;
