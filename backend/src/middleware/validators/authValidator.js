const AppError = require('../../utils/AppError');

/**
 * Authentication Input Validators (EC-2.1, EC-2.3)
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, currencyPreference } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError('Full name is required and must be at least 2 characters.', 400, 'INVALID_NAME'));
  }

  if (name.trim().length > 100) {
    return next(new AppError('Full name cannot exceed 100 characters.', 400, 'NAME_TOO_LONG'));
  }

  // EC-2.1: Validate Email Syntax & Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return next(new AppError('A valid email address is required.', 400, 'INVALID_EMAIL'));
  }

  // EC-2.3: Password Boundary Constraints (Bcrypt truncates at 72 bytes)
  if (!password || typeof password !== 'string') {
    return next(new AppError('Password is required.', 400, 'PASSWORD_REQUIRED'));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT'));
  }

  if (password.length > 72) {
    return next(new AppError('Password cannot exceed 72 characters in length.', 400, 'PASSWORD_TOO_LONG'));
  }

  if (password.trim().length === 0) {
    return next(new AppError('Password cannot consist solely of whitespace.', 400, 'PASSWORD_WHITESPACE_ONLY'));
  }

  // Sanitize Inputs into Request Body
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.password = password;
  if (currencyPreference && typeof currencyPreference === 'string') {
    req.body.currencyPreference = currencyPreference.trim().toUpperCase().substring(0, 5);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return next(new AppError('Email address is required.', 400, 'EMAIL_REQUIRED'));
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return next(new AppError('Password is required.', 400, 'PASSWORD_REQUIRED'));
  }

  req.body.email = email.trim().toLowerCase();
  req.body.password = password;

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { currencyPreference, monthlyIncome, savingsConstraints } = req.body;

  if (currencyPreference !== undefined) {
    if (typeof currencyPreference !== 'string' || currencyPreference.trim().length < 2 || currencyPreference.trim().length > 5) {
      return next(new AppError('Currency preference must be an ISO currency code between 2 and 5 characters.', 400, 'INVALID_CURRENCY'));
    }
    req.body.currencyPreference = currencyPreference.trim().toUpperCase();
  }

  if (monthlyIncome !== undefined && monthlyIncome !== null) {
    const incomeNum = Number(monthlyIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      return next(new AppError('Monthly income must be a positive number or zero.', 400, 'INVALID_INCOME'));
    }
    req.body.monthlyIncome = incomeNum;
  }

  if (savingsConstraints !== undefined && savingsConstraints !== null) {
    if (typeof savingsConstraints !== 'string' || savingsConstraints.length > 300) {
      return next(new AppError('Savings constraints note cannot exceed 300 characters.', 400, 'INVALID_CONSTRAINTS'));
    }
    req.body.savingsConstraints = savingsConstraints.trim();
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
};
