const SavingsGoal = require('../models/SavingsGoal');
const Contribution = require('../models/Contribution');
const GroupMember = require('../models/GroupMember');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Log a contribution toward a savings goal
 * @route POST /api/goals/:id/contributions
 * @access Protected
 */
const addContribution = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const { amount, date, note } = req.body;

  // 1. Fetch Goal and Verify Existence
  const goal = await SavingsGoal.findById(goalId);
  if (!goal) {
    return next(new AppError('Goal not found with the specified ID.', 404, 'GOAL_NOT_FOUND'));
  }

  // 2. Ownership / Group Membership Verification (FR-07)
  const isOwner = goal.ownerId.toString() === req.user.id;
  let isGroupMember = false;
  if (goal.isGroupGoal) {
    isGroupMember = !!(await GroupMember.exists({ goalId, userId: req.user.id }));
  }

  if (!isOwner && !isGroupMember) {
    return next(new AppError('Forbidden: You are not authorized to contribute to this goal.', 403, 'ACCESS_DENIED'));
  }

  // 3. EC-4.6: Verify Goal is not archived
  if (goal.status === 'archived') {
    return next(new AppError('Cannot add contributions to an archived goal. Please restore it first.', 400, 'CANNOT_CONTRIBUTE_TO_ARCHIVED_GOAL'));
  }

  // 4. Record Contribution Document
  const contribution = new Contribution({
    goalId,
    userId: req.user.id,
    amount,
    date,
    note: note || '',
  });
  await contribution.save();

  // 5. EC-4.3: Concurrency Protection — Atomically increment goal balance
  const updatedGoal = await SavingsGoal.findByIdAndUpdate(
    goalId,
    { $inc: { currentAmount: amount } },
    { new: true, runValidators: true }
  );

  // 6. EC-4.5: Check for Goal Completion & Surplus
  const wasPreviouslyActive = goal.status === 'active';
  const isNowCompleted = updatedGoal.currentAmount >= updatedGoal.targetAmount;

  if (isNowCompleted && updatedGoal.status !== 'completed') {
    updatedGoal.status = 'completed';
    await updatedGoal.save();

    // EC-7.5: Trigger completion notification once upon active -> completed status transition
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: goal.ownerId,
        goalId: goal._id,
        type: 'goal_completed',
        title: 'Goal Achieved! 🎉',
        message: `Congratulations! You reached your savings target for '${goal.title}'.`,
      });
    } catch (notifErr) {
      console.warn('Could not dispatch completion notification:', notifErr.message);
    }
  }

  res.status(201).json({
    success: true,
    data: {
      contribution: {
        ...contribution.toJSON(),
        userName: req.user.name,
      },
      goalSummary: {
        id: updatedGoal.id,
        title: updatedGoal.title,
        targetAmount: updatedGoal.targetAmount,
        currentAmount: updatedGoal.currentAmount,
        remainingAmount: updatedGoal.remainingAmount,
        progressPercentage: updatedGoal.progressPercentage,
        status: updatedGoal.status,
        isCompletedNow: wasPreviouslyActive && isNowCompleted,
        surplusAmount: isNowCompleted ? Math.max(0, Number((updatedGoal.currentAmount - updatedGoal.targetAmount).toFixed(2))) : 0,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get contribution history for a goal
 * @route GET /api/goals/:id/contributions
 * @access Protected
 */
const getContributions = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;

  // Verify Goal Existence & Ownership / Membership (FR-07)
  const goal = await SavingsGoal.findById(goalId);
  if (!goal) {
    return next(new AppError('Goal not found with the specified ID.', 404, 'GOAL_NOT_FOUND'));
  }

  const isOwner = goal.ownerId.toString() === req.user.id;
  let isGroupMember = false;
  if (goal.isGroupGoal) {
    isGroupMember = !!(await GroupMember.exists({ goalId, userId: req.user.id }));
  }

  if (!isOwner && !isGroupMember) {
    return next(new AppError('Forbidden: You are not authorized to view this goal history.', 403, 'ACCESS_DENIED'));
  }

  // Pagination parameters
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const total = await Contribution.countDocuments({ goalId });
  const contributions = await Contribution.find({ goalId })
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');

  const formattedData = contributions.map((c) => ({
    id: c.id,
    goalId: c.goalId,
    userId: c.userId?._id?.toString() || c.userId?.toString(),
    userName: c.userId?.name || 'User',
    userEmail: c.userId?.email || '',
    amount: c.amount,
    date: c.date,
    note: c.note,
    createdAt: c.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: formattedData,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = {
  addContribution,
  getContributions,
};
