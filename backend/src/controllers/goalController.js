const SavingsGoal = require('../models/SavingsGoal');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new savings goal
 * @route POST /api/goals
 * @access Protected
 */
const createGoal = asyncHandler(async (req, res) => {
  const { title, description, category, targetAmount, deadline, initialContribution } = req.body;

  const currentAmount = initialContribution || 0;
  // Mark as completed immediately if initial contribution satisfies target amount
  const initialStatus = currentAmount >= targetAmount ? 'completed' : 'active';

  const goal = new SavingsGoal({
    ownerId: req.user.id,
    title,
    description: description || '',
    category: category || 'other',
    targetAmount,
    currentAmount,
    deadline,
    status: initialStatus,
    isGroupGoal: false,
  });

  await goal.save();

  res.status(201).json({
    success: true,
    data: goal.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get all accessible goals for the logged-in user
 * @route GET /api/goals
 * @access Protected
 */
const getGoals = asyncHandler(async (req, res) => {
  const { status, category } = req.query;

  const filter = {
    ownerId: req.user.id,
  };

  // Status filtering (default: active if not specified or unless 'all')
  if (status && status !== 'all') {
    filter.status = status;
  } else if (!status) {
    filter.status = { $in: ['active', 'completed'] };
  }

  // Optional Category filtering
  if (category) {
    filter.category = category.toLowerCase();
  }

  const goals = await SavingsGoal.find(filter).sort({ deadline: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: goals.map((g) => g.toJSON()),
    meta: {
      total: goals.length,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get specific goal details by ID
 * @route GET /api/goals/:id
 * @access Protected (Owner only)
 */
const getGoalById = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found with the specified ID.', 404, 'GOAL_NOT_FOUND'));
  }

  // EC-3.7: Ownership validation (prevent IDOR attacks)
  if (goal.ownerId.toString() !== req.user.id) {
    return next(new AppError('Forbidden: You do not have permission to access this goal.', 403, 'ACCESS_DENIED'));
  }

  res.status(200).json({
    success: true,
    data: goal.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Update an existing savings goal
 * @route PUT /api/goals/:id
 * @access Protected (Owner only)
 */
const updateGoal = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found with the specified ID.', 404, 'GOAL_NOT_FOUND'));
  }

  // EC-3.7: Ownership validation
  if (goal.ownerId.toString() !== req.user.id) {
    return next(new AppError('Forbidden: You do not have permission to modify this goal.', 403, 'ACCESS_DENIED'));
  }

  // EC-3.6: Prevent editing archived goals unless unarchiving
  if (goal.status === 'archived' && req.body.status !== 'active') {
    return next(new AppError('Cannot modify an archived goal. Please restore it first.', 400, 'CANNOT_EDIT_ARCHIVED_GOAL'));
  }

  const { title, description, category, targetAmount, deadline, status } = req.body;

  if (title !== undefined) goal.title = title;
  if (description !== undefined) goal.description = description;
  if (category !== undefined) goal.category = category;
  if (deadline !== undefined) goal.deadline = deadline;
  if (status !== undefined) goal.status = status;

  // EC-3.5: Target Amount adjustment logic
  if (targetAmount !== undefined) {
    goal.targetAmount = targetAmount;
    if (goal.currentAmount >= targetAmount) {
      goal.status = 'completed';
    } else if (goal.status === 'completed' && goal.currentAmount < targetAmount) {
      goal.status = 'active'; // Re-activate if target increased
    }
  }

  await goal.save();

  res.status(200).json({
    success: true,
    data: goal.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Archive / Soft-delete a savings goal
 * @route DELETE /api/goals/:id
 * @access Protected (Owner only)
 */
const deleteGoal = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findById(req.params.id);

  if (!goal) {
    return next(new AppError('Goal not found with the specified ID.', 404, 'GOAL_NOT_FOUND'));
  }

  // EC-3.7: Ownership validation
  if (goal.ownerId.toString() !== req.user.id) {
    return next(new AppError('Forbidden: You do not have permission to delete this goal.', 403, 'ACCESS_DENIED'));
  }

  // Soft-delete: change status to archived
  goal.status = 'archived';
  await goal.save();

  res.status(200).json({
    success: true,
    message: 'Goal successfully archived.',
    data: goal.toJSON(),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};
