const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Dummy bcrypt hash for timing attack mitigation (EC-2.4)
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, currencyPreference } = req.body;

  // EC-2.2: Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS'));
  }

  // Create new user (password will be hashed in User pre-save hook)
  const newUser = new User({
    name,
    email,
    passwordHash: password,
    currencyPreference: currencyPreference || 'INR',
  });

  try {
    await newUser.save();
  } catch (error) {
    // Catch MongoDB duplicate key error 11000 if race condition occurs
    if (error.code === 11000) {
      return next(new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS'));
    }
    return next(error);
  }

  // Generate JWT auth token
  const token = newUser.generateAuthToken();

  res.status(201).json({
    success: true,
    data: {
      token,
      user: newUser.toJSON(),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Authenticate existing user
 * @route POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve user with passwordHash
  const user = await User.findOne({ email }).select('+passwordHash');

  // EC-2.4: Constant-time comparison to prevent user enumeration via timing attacks
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
  }

  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    data: {
      token,
      user: user.toJSON(),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get current authenticated user profile
 * @route GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Update authenticated user financial profile
 * @route PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { currencyPreference, monthlyIncome, savingsConstraints } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
  }

  if (currencyPreference !== undefined) {
    user.currencyPreference = currencyPreference;
  }
  if (monthlyIncome !== undefined) {
    user.monthlyIncome = monthlyIncome;
  }
  if (savingsConstraints !== undefined) {
    user.savingsConstraints = savingsConstraints;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
