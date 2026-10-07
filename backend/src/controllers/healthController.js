const mongoose = require('mongoose');
const connectDB = require('../config/db');

/**
 * Health Check Controller
 * Verifies server operational status and MongoDB connectivity.
 */
const getHealthStatus = async (req, res) => {
  try {
    // Ensure MongoDB connection is established
    await connectDB();

    const isDbConnected = mongoose.connection.readyState === 1;
    const uptimeSeconds = Math.floor(process.uptime());

    const responsePayload = {
      status: isDbConnected ? 'UP' : 'DEGRADED',
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
    };

    if (isDbConnected) {
      return res.status(200).json({
        success: true,
        ...responsePayload,
      });
    }

    return res.status(503).json({
      success: false,
      ...responsePayload,
    });
  } catch (error) {
    console.error(
      '[Health Check] Database connection failed:',
      error.message
    );

    return res.status(503).json({
      success: false,
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error:
        process.env.NODE_ENV === 'production'
          ? 'Database connection failed'
          : error.message,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    });
  }
};

module.exports = {
  getHealthStatus,
};