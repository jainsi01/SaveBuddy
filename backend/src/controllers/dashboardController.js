const mongoose = require('mongoose');
const SavingsGoal = require('../models/SavingsGoal');
const GroupMember = require('../models/GroupMember');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get Dashboard Summary Metrics (FR-08, API Spec 8.1, EC-7.1 - EC-7.3)
 * GET /api/dashboard/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Identify all goal IDs accessible by this user (personal + group goals)
  const memberships = await GroupMember.find({ userId });
  const groupGoalIds = memberships.map((m) => m.goalId);

  const goalQuery = {
    $or: [{ ownerId: userId }, { _id: { $in: groupGoalIds } }],
    status: { $ne: 'archived' },
  };

  const goals = await SavingsGoal.find(goalQuery);

  // 2. EC-7.1: Zero-state safety — Handle brand new users with 0 goals
  if (!goals || goals.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalSaved: 0,
        totalTarget: 0,
        overallProgress: 0,
        activeGoalsCount: 0,
        completedGoalsCount: 0,
        urgentGoals: [],
      },
    });
  }

  // 3. Compute high-level aggregations
  let totalSaved = 0;
  let totalTarget = 0;
  let activeGoalsCount = 0;
  let completedGoalsCount = 0;

  const now = new Date();
  const activeGoals = [];

  goals.forEach((g) => {
    totalSaved += Number(g.currentAmount || 0);
    totalTarget += Number(g.targetAmount || 0);

    if (g.status === 'completed' || g.currentAmount >= g.targetAmount) {
      completedGoalsCount++;
    } else {
      activeGoalsCount++;
      activeGoals.push(g);
    }
  });

  totalSaved = Math.round(totalSaved * 100) / 100;
  totalTarget = Math.round(totalTarget * 100) / 100;

  const overallProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 10000) / 100) : 0;

  // 4. EC-7.2: Power user safety — Sort and cap urgent goals to top 5
  activeGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const topUrgent = activeGoals.slice(0, 5);

  const urgentGoalsFormatted = [];

  for (const g of topUrgent) {
    const diffMs = new Date(g.deadline).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // EC-7.3: Prevent deadline notification spamming (24h cooldown)
    if (daysRemaining <= 7 && daysRemaining >= 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingAlert = await Notification.findOne({
        userId,
        goalId: g._id,
        type: 'deadline_warning',
        createdAt: { $gte: oneDayAgo },
      });

      if (!existingAlert) {
        await Notification.create({
          userId,
          goalId: g._id,
          type: 'deadline_warning',
          title: 'Upcoming Deadline Alert',
          message:
            daysRemaining === 0
              ? `Your goal '${g.title}' is due today!`
              : `Your goal '${g.title}' is due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
        });
      }
    }

    urgentGoalsFormatted.push({
      id: g._id.toString(),
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
      daysRemaining,
      category: g.category,
      isGroupGoal: g.isGroupGoal,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalSaved,
      totalTarget,
      overallProgress,
      activeGoalsCount,
      completedGoalsCount,
      urgentGoals: urgentGoalsFormatted,
    },
  });
});

module.exports = {
  getSummary,
};
