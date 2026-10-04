const AppError = require('../../utils/AppError');

/**
 * Validate Contribution Submission (EC-4.1, EC-4.2, EC-4.7)
 */
const validateAddContribution = (req, res, next) => {
  const { amount, date, note } = req.body;

  // EC-4.1: Validate Amount is positive number
  if (amount === undefined || amount === null || amount === '') {
    return next(new AppError('Contribution amount is required.', 400, 'AMOUNT_REQUIRED'));
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return next(new AppError('Contribution amount must be a positive number greater than zero.', 400, 'INVALID_CONTRIBUTION_AMOUNT'));
  }

  if (numAmount > 1000000000) {
    return next(new AppError('Contribution amount cannot exceed 1,000,000,000.', 400, 'AMOUNT_TOO_HIGH'));
  }

  // EC-4.2: Enforce 2 decimal places precision
  const cleanAmount = Number(numAmount.toFixed(2));

  // EC-4.7: Validate Contribution Date (cannot be future date)
  let contributionDate = new Date();
  if (date) {
    contributionDate = new Date(date);
    if (isNaN(contributionDate.getTime())) {
      return next(new AppError('Invalid date format for contribution.', 400, 'INVALID_DATE_FORMAT'));
    }
    // Allow up to 5 minutes clock drift tolerance
    const maxFutureTime = Date.now() + 5 * 60 * 1000;
    if (contributionDate.getTime() > maxFutureTime) {
      return next(new AppError('Contribution date cannot be set in the future.', 400, 'FUTURE_DATE_NOT_ALLOWED'));
    }
  }

  // Validate Note
  if (note && (typeof note !== 'string' || note.length > 200)) {
    return next(new AppError('Contribution note cannot exceed 200 characters.', 400, 'NOTE_TOO_LONG'));
  }

  req.body.amount = cleanAmount;
  req.body.date = contributionDate;
  req.body.note = note ? note.trim() : '';

  next();
};

module.exports = {
  validateAddContribution,
};
