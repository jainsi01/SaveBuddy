const mongoose = require('mongoose');
const SavingsGoal = require('../models/SavingsGoal');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create Collaborative Group Goal (FR-07, API Spec 7.1)
 * POST /api/group-goals
 */
const createGroupGoal = asyncHandler(async (req, res, next) => {
  const { title, description, category, targetAmount, deadline, initialMembers } = req.body;

  // 1. Create SavingsGoal entity with isGroupGoal: true
  const goal = new SavingsGoal({
    ownerId: req.user.id,
    title,
    description: description || '',
    category: category || 'other',
    targetAmount,
    currentAmount: 0,
    deadline,
    status: 'active',
    isGroupGoal: true,
  });

  await goal.save();

  // 2. Automatically register creator as group 'owner'
  const ownerMembership = new GroupMember({
    goalId: goal._id,
    userId: req.user.id,
    role: 'owner',
  });
  await ownerMembership.save();

  let membersCount = 1;

  // 3. Process optional initial members list (by email)
  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    for (const email of initialMembers) {
      if (!email || typeof email !== 'string') continue;
      const cleanEmail = email.trim().toLowerCase();
      // Skip owner's own email (EC-6.3)
      if (cleanEmail === req.user.email.toLowerCase()) continue;

      const targetUser = await User.findOne({ email: cleanEmail });
      if (targetUser) {
        // Prevent duplicate initial member (EC-6.1)
        const alreadyMember = await GroupMember.findOne({
          goalId: goal._id,
          userId: targetUser._id,
        });

        if (!alreadyMember) {
          await GroupMember.create({
            goalId: goal._id,
            userId: targetUser._id,
            role: 'member',
          });
          membersCount++;
        }
      }
    }
  }

  res.status(201).json({
    success: true,
    data: {
      id: goal._id.toString(),
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progressPercentage: goal.progressPercentage,
      deadline: goal.deadline,
      isGroupGoal: true,
      membersCount,
      createdAt: goal.createdAt,
    },
  });
});

/**
 * Get all Group Goals where logged-in user is an owner or member
 * GET /api/group-goals
 */
const getGroupGoals = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find all memberships for this user
  const memberships = await GroupMember.find({ userId });
  const goalIds = memberships.map((m) => m.goalId);

  // Also include any group goals where user is owner
  const goals = await SavingsGoal.find({
    $or: [{ _id: { $in: goalIds } }, { ownerId: userId, isGroupGoal: true }],
    isGroupGoal: true,
    status: { $ne: 'archived' },
  }).sort({ createdAt: -1 });

  // Enrich with members count and user role
  const enrichedGoals = await Promise.all(
    goals.map(async (g) => {
      const count = await GroupMember.countDocuments({ goalId: g._id });
      const userMember = memberships.find((m) => m.goalId.toString() === g._id.toString());
      const role = g.ownerId.toString() === userId.toString() ? 'owner' : (userMember?.role || 'member');
      const jsonGoal = g.toJSON();
      return {
        ...jsonGoal,
        membersCount: count,
        userRole: role,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: enrichedGoals,
  });
});

/**
 * Get Group Goal details by ID including member roster
 * GET /api/group-goals/:id
 */
const getGroupGoalById = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const userId = req.user.id;

  const goal = await SavingsGoal.findById(goalId);
  if (!goal || !goal.isGroupGoal) {
    return next(new AppError('Group goal not found.', 404, 'GOAL_NOT_FOUND'));
  }

  // Check membership
  const memberships = await GroupMember.find({ goalId }).populate('userId', 'name email');
  const userMember = memberships.find((m) => m.userId?._id?.toString() === userId.toString());
  const isOwner = goal.ownerId.toString() === userId.toString();

  if (!userMember && !isOwner) {
    return next(
      new AppError('Access denied: You are not a member of this group goal.', 403, 'NOT_A_GROUP_MEMBER')
    );
  }

  const members = memberships.map((m) => ({
    userId: m.userId?._id?.toString() || m.userId?.toString(),
    name: m.userId?.name || 'Group Member',
    email: m.userId?.email || '',
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  const jsonGoal = goal.toJSON();

  res.status(200).json({
    success: true,
    data: {
      ...jsonGoal,
      membersCount: members.length,
      userRole: isOwner ? 'owner' : (userMember?.role || 'member'),
      members,
    },
  });
});

/**
 * Add Member to Group Goal (FR-07, API Spec 7.2, EC-6.1 - EC-6.4)
 * POST /api/group-goals/:id/members
 */
const addMember = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return next(new AppError('A valid email address is required to invite a member.', 400, 'INVALID_EMAIL'));
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. EC-6.2: Inviting non-existent or unregistered user
  const targetUser = await User.findOne({ email: cleanEmail });
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'No registered user found with this email address. Please invite them to sign up first.',
      code: 'USER_NOT_FOUND',
    });
  }

  // 2. EC-6.3: Group creator / owner inviting themselves
  if (targetUser._id.toString() === req.user.id.toString()) {
    return res.status(400).json({
      success: false,
      error: 'You are already the owner of this group goal.',
      code: 'CANNOT_INVITE_SELF',
    });
  }

  // 3. EC-6.1: Duplicate Member Invitation
  const existing = await GroupMember.findOne({ goalId, userId: targetUser._id });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'User is already a member of this group goal.',
      code: 'MEMBER_ALREADY_EXISTS',
    });
  }

  // 4. Register new member
  const newMember = new GroupMember({
    goalId,
    userId: targetUser._id,
    role: 'member',
  });
  await newMember.save();

  res.status(201).json({
    success: true,
    message: 'Member successfully added to group goal.',
    data: {
      userId: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: 'member',
      joinedAt: newMember.joinedAt,
    },
  });
});

/**
 * Remove Member or Leave Group (FR-07, API Spec 7.3, EC-6.4, EC-6.5)
 * DELETE /api/group-goals/:id/members/:userId
 */
const removeMember = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;
  const targetUserId = req.params.userId;
  const currentUserId = req.user.id;

  const goal = await SavingsGoal.findById(goalId);
  if (!goal) {
    return next(new AppError('Group goal not found.', 404, 'GOAL_NOT_FOUND'));
  }

  const isOwner = goal.ownerId.toString() === currentUserId.toString();
  const isSelf = currentUserId.toString() === targetUserId.toString();

  // EC-6.4: Only group owner or the member themselves can perform removal
  if (!isOwner && !isSelf) {
    return next(
      new AppError('Forbidden: Only the group owner can remove other members.', 403, 'OWNER_ONLY_ACTION')
    );
  }

  // EC-6.5: Owner leaving without transfer
  if (goal.ownerId.toString() === targetUserId.toString()) {
    return res.status(400).json({
      success: false,
      error: 'The group owner cannot leave the group. Transfer ownership or archive the goal instead.',
      code: 'OWNER_CANNOT_LEAVE',
    });
  }

  const membership = await GroupMember.findOneAndDelete({
    goalId,
    userId: targetUserId,
  });

  if (!membership) {
    return next(new AppError('Member not found in this group goal.', 404, 'MEMBER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: isSelf
      ? 'You have successfully left the group goal.'
      : 'Member successfully removed from group.',
  });
});

/**
 * Get Member Contribution Breakdown (FR-07, API Spec 7.4, EC-6.6, EC-6.7)
 * GET /api/group-goals/:id/breakdown
 */
const getGroupBreakdown = asyncHandler(async (req, res, next) => {
  const goalId = req.params.id;

  const goal = await SavingsGoal.findById(goalId);
  if (!goal) {
    return next(new AppError('Group goal not found.', 404, 'GOAL_NOT_FOUND'));
  }

  // 1. Fetch all registered members of the group
  const members = await GroupMember.find({ goalId }).populate('userId', 'name email');

  // 2. EC-6.6: Aggregate contributions per user directly from ledger
  const contributionAggregates = await Contribution.aggregate([
    { $match: { goalId: new mongoose.Types.ObjectId(goalId) } },
    {
      $group: {
        _id: '$userId',
        totalContributed: { $sum: '$amount' },
        contributionCount: { $sum: 1 },
      },
    },
  ]);

  // Convert aggregates to a fast lookup map
  const aggregateMap = new Map();
  contributionAggregates.forEach((item) => {
    aggregateMap.set(item._id.toString(), {
      totalContributed: item.totalContributed,
      contributionCount: item.contributionCount,
    });
  });

  const targetAmount = goal.targetAmount;
  const currentAmount = goal.currentAmount;

  // 3. EC-6.7: Merge all members so zero-contribution members are preserved
  const memberBreakdowns = members.map((m) => {
    const uId = m.userId?._id?.toString() || m.userId?.toString();
    const stats = aggregateMap.get(uId) || { totalContributed: 0, contributionCount: 0 };
    const totalContributed = Math.round(stats.totalContributed * 100) / 100;

    const percentageOfTarget =
      targetAmount > 0 ? Math.round((totalContributed / targetAmount) * 10000) / 100 : 0;
    const percentageOfTotalSaved =
      currentAmount > 0 ? Math.round((totalContributed / currentAmount) * 10000) / 100 : 0;

    return {
      userId: uId,
      name: m.userId?.name || 'Member',
      email: m.userId?.email || '',
      role: m.role,
      totalContributed,
      percentageOfTarget,
      percentageOfTotalSaved,
      contributionCount: stats.contributionCount,
    };
  });

  // Sort by highest contribution descending (leaderboard view)
  memberBreakdowns.sort((a, b) => b.totalContributed - a.totalContributed);

  res.status(200).json({
    success: true,
    data: {
      goalId: goal._id.toString(),
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      totalProgress: goal.progressPercentage,
      members: memberBreakdowns,
    },
  });
});

module.exports = {
  createGroupGoal,
  getGroupGoals,
  getGroupGoalById,
  addMember,
  removeMember,
  getGroupBreakdown,
};
