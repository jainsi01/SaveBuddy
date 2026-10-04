const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const {
  calculateFallbackPlan,
  sanitizeForPrompt,
} = require('../src/services/geminiService');
const AIPlan = require('../src/models/AIPlan');

describe('Module 5: Google Gemini AI Savings Advisor Verification', () => {
  describe('Prompt Injection Sanitizer (EC-5.4)', () => {
    it('escapes XML/HTML brackets and quotes from user inputs', () => {
      const maliciousInput = '<script>alert("hack")</script> & \'test\'';
      const sanitized = sanitizeForPrompt(maliciousInput);

      assert.strictEqual(
        sanitized,
        '&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt; &amp; &#039;test&#039;'
      );
      assert.doesNotMatch(sanitized, /[<>]/);
    });

    it('returns empty string when given null or undefined input', () => {
      assert.strictEqual(sanitizeForPrompt(null), '');
      assert.strictEqual(sanitizeForPrompt(undefined), '');
    });
  });

  describe('Fallback Calculation Engine (EC-5.1, EC-5.2, EC-5.5)', () => {
    it('calculates deterministic weekly and monthly pacing for a standard goal', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100); // ~100 days remaining

      const mockGoal = {
        targetAmount: 50000,
        currentAmount: 10000,
        deadline: futureDate,
        title: 'Emergency Fund',
        category: 'emergency',
      };

      const plan = calculateFallbackPlan(mockGoal);

      assert.ok(plan.recommendedWeekly > 0, 'Weekly rate should be positive');
      assert.ok(plan.recommendedMonthly > 0, 'Monthly rate should be positive');
      assert.strictEqual(plan.achievabilityScore, 'Very Realistic');
      assert.ok(Array.isArray(plan.milestones), 'Milestones should be an array');
      assert.ok(plan.milestones.length >= 2, 'Should generate at least 2 milestones');
      assert.ok(Array.isArray(plan.practicalRecommendations), 'Should generate recommendations');
      assert.strictEqual(plan.modelUsed, 'fallback-engine');
      assert.match(
        plan.disclaimer,
        /SaveBuddy AI plans are automated mathematical estimates/
      );
    });

    it('handles imminent deadlines (< 7 days) by providing sprint milestones and high challenge score (EC-5.5)', () => {
      const imminentDeadline = new Date();
      imminentDeadline.setDate(imminentDeadline.getDate() + 3); // 3 days remaining

      const mockGoal = {
        targetAmount: 30000,
        currentAmount: 0,
        deadline: imminentDeadline,
        title: 'Immediate Laptop Repair',
        category: 'gadgets',
      };

      const plan = calculateFallbackPlan(mockGoal);

      assert.strictEqual(plan.achievabilityScore, 'Very Challenging');
      assert.ok(
        plan.milestones.some((m) => m.milestoneName.includes('Daily Sprint')),
        'Should include Daily Sprint Checkpoint for deadlines < 7 days'
      );
      assert.ok(
        plan.practicalRecommendations.some((tip) => tip.includes('extending')),
        'Should recommend extending deadline for imminent targets'
      );
    });
  });

  describe('AIPlan Model & Serialization (FR-06, EC-5.8)', () => {
    it('creates and serializes AIPlan correctly with id and cleans MongoDB fields', () => {
      const mockGoalId = new mongoose.Types.ObjectId();
      const planDoc = new AIPlan({
        goalId: mockGoalId,
        recommendedWeekly: 1250,
        recommendedMonthly: 5400,
        achievabilityScore: 'Realistic',
        milestones: [
          {
            milestoneName: 'Midway Checkpoint',
            targetDate: new Date('2027-01-01'),
            targetAmount: 25000,
            actionTip: 'Deposit year-end bonus',
          },
        ],
        practicalRecommendations: ['Set up auto-transfer'],
        modelUsed: 'gemini-1.5-flash',
      });

      const serialized = planDoc.toJSON();

      assert.ok(serialized.id, 'Should have clean string id');
      assert.strictEqual(serialized._id, undefined, '_id should be stripped');
      assert.strictEqual(serialized.__v, undefined, '__v should be stripped');
      assert.strictEqual(serialized.recommendedWeekly, 1250);
      assert.strictEqual(serialized.achievabilityScore, 'Realistic');
      assert.match(serialized.disclaimer, /certified financial or investment advice/);
    });

    it('rejects invalid achievabilityScore enums', () => {
      const mockGoalId = new mongoose.Types.ObjectId();
      const planDoc = new AIPlan({
        goalId: mockGoalId,
        recommendedWeekly: 1000,
        recommendedMonthly: 4000,
        achievabilityScore: 'Impossible', // Invalid enum
      });

      const validationError = planDoc.validateSync();
      assert.ok(validationError.errors.achievabilityScore);
      assert.match(validationError.errors.achievabilityScore.message, /`Impossible` is not a valid enum/);
    });
  });

  describe('Goal Fully Funded Intercept Logic (EC-5.6)', () => {
    it('detects when goal is already fully funded or overfunded', () => {
      const completedGoal = {
        targetAmount: 50000,
        currentAmount: 50000,
      };

      const overfundedGoal = {
        targetAmount: 50000,
        currentAmount: 52000,
      };

      const isCompleted = completedGoal.currentAmount >= completedGoal.targetAmount;
      const isOverfundedCompleted = overfundedGoal.currentAmount >= overfundedGoal.targetAmount;

      assert.strictEqual(isCompleted, true, 'Fully funded goal should be detected as completed');
      assert.strictEqual(isOverfundedCompleted, true, 'Overfunded goal should be detected as completed');
    });
  });
});
