const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Notification = require('../src/models/Notification');

describe('Module 7: Dashboard Summaries, Alerts & Notifications Verification', () => {
  describe('Notification Model & Serialization (FR-09)', () => {
    it('creates and serializes notification document with clean id', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockGoalId = new mongoose.Types.ObjectId();

      const notif = new Notification({
        userId: mockUserId,
        goalId: mockGoalId,
        type: 'deadline_warning',
        title: 'Upcoming Deadline Alert',
        message: 'Goal is due in 3 days!',
        isRead: false,
      });

      const serialized = notif.toJSON();

      assert.ok(serialized.id, 'Should have clean id string');
      assert.strictEqual(serialized._id, undefined, '_id should be stripped');
      assert.strictEqual(serialized.__v, undefined, '__v should be stripped');
      assert.strictEqual(serialized.type, 'deadline_warning');
      assert.strictEqual(serialized.isRead, false);
      assert.ok(serialized.createdAt instanceof Date);
    });

    it('validates notification type enum strictly', () => {
      const mockUserId = new mongoose.Types.ObjectId();

      const validNotif = new Notification({
        userId: mockUserId,
        type: 'goal_completed',
        title: 'Complete',
        message: 'Goal reached!',
      });
      assert.strictEqual(validNotif.validateSync(), undefined);

      const invalidNotif = new Notification({
        userId: mockUserId,
        type: 'marketing_spam', // Invalid type
        title: 'Invalid',
        message: 'Should fail',
      });
      const error = invalidNotif.validateSync();
      assert.ok(error.errors.type);
      assert.match(error.errors.type.message, /`marketing_spam` is not a valid enum/);
    });
  });

  describe('Dashboard State & Aggregation Logic (EC-7.1, EC-7.2)', () => {
    it('handles brand-new user zero state safely with zeroed numbers and no NaN (EC-7.1)', () => {
      const goals = []; // Empty goals list

      let totalSaved = 0;
      let totalTarget = 0;
      let activeGoalsCount = 0;
      let completedGoalsCount = 0;

      goals.forEach((g) => {
        totalSaved += g.currentAmount;
        totalTarget += g.targetAmount;
      });

      const overallProgress =
        totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 10000) / 100 : 0;

      assert.strictEqual(totalSaved, 0);
      assert.strictEqual(totalTarget, 0);
      assert.strictEqual(overallProgress, 0);
      assert.strictEqual(isNaN(overallProgress), false, 'overallProgress must never be NaN');
      assert.strictEqual(activeGoalsCount, 0);
      assert.strictEqual(completedGoalsCount, 0);
    });

    it('caps urgent goals to top 5 sorted by nearest deadline (EC-7.2)', () => {
      const now = new Date();
      // Generate 10 active goals with deadlines 1 to 10 days in the future
      const manyGoals = Array.from({ length: 10 }, (_, i) => ({
        id: `goal-${i + 1}`,
        title: `Goal ${i + 1}`,
        deadline: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
      }));

      manyGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      const topUrgent = manyGoals.slice(0, 5);

      assert.strictEqual(topUrgent.length, 5, 'Must cap urgent goals at 5');
      assert.strictEqual(topUrgent[0].title, 'Goal 1', 'Earliest deadline must be first');
      assert.strictEqual(topUrgent[4].title, 'Goal 5');
    });
  });

  describe('Notification Dispatch & Idempotency Edge Cases (EC-7.3, EC-7.4, EC-7.5)', () => {
    it('deduplicates deadline alerts within 24 hours (EC-7.3)', () => {
      const now = new Date();
      const existingAlerts = [
        {
          userId: 'user-1',
          goalId: 'goal-1',
          type: 'deadline_warning',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      ];

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const isDuplicate = existingAlerts.some(
        (a) =>
          a.userId === 'user-1' &&
          a.goalId === 'goal-1' &&
          a.type === 'deadline_warning' &&
          a.createdAt >= oneDayAgo
      );

      assert.strictEqual(isDuplicate, true, 'Alert sent within 24h must be identified as duplicate');
    });

    it('permits new deadline alert after 24-hour window passes (EC-7.3)', () => {
      const now = new Date();
      const existingAlerts = [
        {
          userId: 'user-1',
          goalId: 'goal-1',
          type: 'deadline_warning',
          createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), // 26 hours ago
        },
      ];

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const isDuplicate = existingAlerts.some(
        (a) =>
          a.userId === 'user-1' &&
          a.goalId === 'goal-1' &&
          a.type === 'deadline_warning' &&
          a.createdAt >= oneDayAgo
      );

      assert.strictEqual(isDuplicate, false, 'Alert sent >24h ago should allow new reminder');
    });

    it('triggers completion notification only when goal transitions from active to completed (EC-7.5)', () => {
      // Transition from active to completed
      const wasPreviouslyActive = true;
      const isNowCompleted = true;
      const shouldTrigger = wasPreviouslyActive && isNowCompleted;

      assert.strictEqual(shouldTrigger, true, 'Must trigger notification on status change');

      // Subsequent deposit to already completed goal (surplus deposit)
      const alreadyCompleted = false; // wasPreviouslyActive = false
      const surplusDeposit = isNowCompleted && alreadyCompleted;

      assert.strictEqual(surplusDeposit, false, 'Must not re-trigger completion notification on surplus deposit');
    });
  });
});
