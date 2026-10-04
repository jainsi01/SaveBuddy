const mongoose = require('mongoose');

/**
 * Health Check Controller
 * Returns server operational status, database readiness, and uptime.
 */
const getHealthStatus = (req, res) => {
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

  // EC-1.2: Return 503 if database connection is not ready
  return res.status(503).json({
    success: false,
    ...responsePayload,
  });
};

module.exports = {
  getHealthStatus,
};
