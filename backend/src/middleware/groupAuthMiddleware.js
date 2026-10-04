const SavingsGoal = require('../models/SavingsGoal');
const GroupMember = require('../models/GroupMember');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware: Verify user is a member of the group goal (EC-6.4)
 */
const requireGroupMembership = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const userId = req.user.id;

  const goal = await SavingsGoal.findById(goalId);
  if (!goal) {
    return next(new AppError('Savings goal not found.', 404, 'GOAL_NOT_FOUND'));
  }

  if (!goal.isGroupGoal) {
    return next(
      new AppError('The specified goal is an individual goal, not a group goal.', 400, 'NOT_A_GROUP_GOAL')
    );
  }

  // Check if owner or member in GroupMember collection
  const membership = await GroupMember.findOne({ goalId, userId });
  const isGoalOwner = goal.ownerId.toString() === userId.toString();

  if (!membership && !isGoalOwner) {
    return next(
      new AppError('Access denied: You are not a member of this group goal.', 403, 'NOT_A_GROUP_MEMBER')
    );
  }

  req.groupGoal = goal;
  req.groupMember = membership || { role: isGoalOwner ? 'owner' : 'member' };
  next();
});

/**
 * Middleware: Verify user is the group goal owner (EC-6.4)
 */
const requireGroupOwner = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const userId = req.user.id;

  const goal = req.groupGoal || (await SavingsGoal.findById(goalId));
  if (!goal) {
    return next(new AppError('Savings goal not found.', 404, 'GOAL_NOT_FOUND'));
  }

  const isOwner =
    goal.ownerId.toString() === userId.toString() ||
    (req.groupMember && req.groupMember.role === 'owner');

  if (!isOwner) {
    return next(
      new AppError('Forbidden: Only the group owner can perform this administrative action.', 403, 'OWNER_ONLY_ACTION')
    );
  }

  req.groupGoal = goal;
  next();
});

module.exports = {
  requireGroupMembership,
  requireGroupOwner,
};
