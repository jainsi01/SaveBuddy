const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware (EC-2.6, EC-2.7)
 * Validates JWT Bearer tokens from the Authorization header and attaches the user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // Extract Bearer Token from HTTP Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401, 'NO_TOKEN_PROVIDED'));
  }

  try {
    // EC-2.6: Verify Token Signature and Expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // EC-2.7: Verify User Still Exists in Database (Stale Token Protection)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NO_LONGER_EXISTS'));
    }

    // Attach User to Request Context
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN'));
    }
    return next(error);
  }
});

module.exports = {
  protect,
};
