const AppError = require('../../utils/AppError');

const VALID_CATEGORIES = [
  'emergency',
  'travel',
  'gadgets',
  'education',
  'vehicle',
  'home',
  'lifestyle',
  'other',
];

/**
 * Validate Goal Creation (EC-3.1, EC-3.2, EC-3.3)
 */
const validateCreateGoal = (req, res, next) => {
  const { title, description, category, targetAmount, deadline, initialContribution } = req.body;

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return next(new AppError('Goal title is required and must be at least 3 characters long.', 400, 'INVALID_TITLE'));
  }
  if (title.trim().length > 100) {
    return next(new AppError('Goal title cannot exceed 100 characters.', 400, 'TITLE_TOO_LONG'));
  }

  // Target Amount validation (EC-3.1)
  const targetNum = Number(targetAmount);
  if (isNaN(targetNum) || targetNum <= 0) {
    return next(new AppError('Target amount must be a positive number greater than zero.', 400, 'INVALID_TARGET_AMOUNT'));
  }
  if (targetNum > 1000000000) {
    return next(new AppError('Target amount cannot exceed 1,000,000,000.', 400, 'TARGET_AMOUNT_TOO_HIGH'));
  }

  // Deadline validation (EC-3.3)
  if (!deadline) {
    return next(new AppError('A target deadline date is required.', 400, 'DEADLINE_REQUIRED'));
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return next(new AppError('Invalid date format for deadline.', 400, 'INVALID_DEADLINE_FORMAT'));
  }
  if (deadlineDate <= new Date()) {
    return next(new AppError('Goal deadline must be set to a future date.', 400, 'DEADLINE_NOT_IN_FUTURE'));
  }

  // Optional Category validation
  if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
    return next(new AppError(`Invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`, 400, 'INVALID_CATEGORY'));
  }

  // Optional Description validation (EC-3.2)
  if (description && (typeof description !== 'string' || description.length > 500)) {
    return next(new AppError('Description cannot exceed 500 characters.', 400, 'DESCRIPTION_TOO_LONG'));
  }

  // Optional Initial Contribution validation
  let cleanInitial = 0;
  if (initialContribution !== undefined && initialContribution !== null && initialContribution !== '') {
    const initNum = Number(initialContribution);
    if (isNaN(initNum) || initNum < 0) {
      return next(new AppError('Initial contribution must be zero or a positive number.', 400, 'INVALID_INITIAL_CONTRIBUTION'));
    }
    cleanInitial = Number(initNum.toFixed(2));
  }

  // Sanitize and clean inputs
  req.body.title = title.trim();
  req.body.description = description ? description.trim() : '';
  req.body.category = category ? category.toLowerCase() : 'other';
  req.body.targetAmount = Number(targetNum.toFixed(2));
  req.body.deadline = deadlineDate;
  req.body.initialContribution = cleanInitial;

  next();
};

/**
 * Validate Goal Update (EC-3.5, EC-3.6)
 */
const validateUpdateGoal = (req, res, next) => {
  const { title, description, category, targetAmount, deadline } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      return next(new AppError('Goal title must be at least 3 characters long.', 400, 'INVALID_TITLE'));
    }
    if (title.trim().length > 100) {
      return next(new AppError('Goal title cannot exceed 100 characters.', 400, 'TITLE_TOO_LONG'));
    }
    req.body.title = title.trim();
  }

  if (targetAmount !== undefined) {
    const targetNum = Number(targetAmount);
    if (isNaN(targetNum) || targetNum <= 0) {
      return next(new AppError('Target amount must be a positive number greater than zero.', 400, 'INVALID_TARGET_AMOUNT'));
    }
    if (targetNum > 1000000000) {
      return next(new AppError('Target amount cannot exceed 1,000,000,000.', 400, 'TARGET_AMOUNT_TOO_HIGH'));
    }
    req.body.targetAmount = Number(targetNum.toFixed(2));
  }

  if (deadline !== undefined) {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return next(new AppError('Invalid date format for deadline.', 400, 'INVALID_DEADLINE_FORMAT'));
    }
    req.body.deadline = deadlineDate;
  }

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
      return next(new AppError(`Invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`, 400, 'INVALID_CATEGORY'));
    }
    req.body.category = category.toLowerCase();
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > 500) {
      return next(new AppError('Description cannot exceed 500 characters.', 400, 'DESCRIPTION_TOO_LONG'));
    }
    req.body.description = description.trim();
  }

  next();
};

module.exports = {
  validateCreateGoal,
  validateUpdateGoal,
};
