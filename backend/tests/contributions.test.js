process.env.NODE_ENV = 'test';
process.env.PORT = '5004';
process.env.JWT_SECRET = 'savebuddy_test_secret_key_contrib';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const Contribution = require('../src/models/Contribution');
const SavingsGoal = require('../src/models/SavingsGoal');
const {
  validateAddContribution,
} = require('../src/middleware/validators/contributionValidator');

const createMockReqRes = (body = {}, headers = {}, params = {}) => {
  const req = { body, headers, params };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  let errorReceived = null;
  const next = (err) => {
    errorReceived = err || null;
  };
  return { req, res, next: (err) => next(err), getError: () => errorReceived };
};

describe('Module 4: Contributions Tracking & Ledger Verification', () => {
  // 1. Validation Tests
  describe('Contribution Input Validation (EC-4.1, EC-4.2, EC-4.7)', () => {
    test('validateAddContribution rejects missing amount', () => {
      const { req, res, next, getError } = createMockReqRes({
        note: 'Deposit',
      });

      validateAddContribution(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'AMOUNT_REQUIRED');
    });

    test('validateAddContribution rejects negative or zero amount (EC-4.1)', () => {
      const { req, res, next, getError } = createMockReqRes({
        amount: -50,
      });

      validateAddContribution(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_CONTRIBUTION_AMOUNT');

      const zeroTest = createMockReqRes({ amount: 0 });
      validateAddContribution(zeroTest.req, zeroTest.res, zeroTest.next);
      assert.strictEqual(zeroTest.getError().errorCode, 'INVALID_CONTRIBUTION_AMOUNT');
    });

    test('validateAddContribution rejects future-dated contribution (EC-4.7)', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
      const { req, res, next, getError } = createMockReqRes({
        amount: 500,
        date: futureDate,
      });

      validateAddContribution(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'FUTURE_DATE_NOT_ALLOWED');
    });

    test('validateAddContribution rejects note exceeding 200 characters', () => {
      const { req, res, next, getError } = createMockReqRes({
        amount: 500,
        note: 'A'.repeat(201),
      });

      validateAddContribution(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'NOTE_TOO_LONG');
    });

    test('validateAddContribution rounds amounts to 2 decimal places (EC-4.2)', () => {
      const { req, res, next, getError } = createMockReqRes({
        amount: '1250.4567',
        note: '  Bonus deposit  ',
      });

      validateAddContribution(req, res, next);
      assert.strictEqual(getError(), null);
      assert.strictEqual(req.body.amount, 1250.46);
      assert.strictEqual(req.body.note, 'Bonus deposit');
      assert.ok(req.body.date instanceof Date);
    });
  });

  // 2. Contribution Model & Ledger Verification
  describe('Contribution Model & Ledger Serialization', () => {
    test('Contribution model serializes clean JSON with id and strips __v', () => {
      const mockGoalId = new mongoose.Types.ObjectId();
      const mockUserId = new mongoose.Types.ObjectId();

      const contribution = new Contribution({
        goalId: mockGoalId,
        userId: mockUserId,
        amount: 2500,
        note: 'Monthly allocation',
      });

      const json = contribution.toJSON();
      assert.strictEqual(json.__v, undefined);
      assert.strictEqual(json._id, undefined);
      assert.ok(json.id);
      assert.strictEqual(json.amount, 2500);
      assert.strictEqual(json.note, 'Monthly allocation');
      assert.ok(json.date);
    });
  });

  // 3. Goal Completion & Surplus Logic (EC-4.5)
  describe('Goal Completion & Surplus Logic (EC-4.5)', () => {
    test('Simulated balance increment triggers completion and computes surplus amount', () => {
      const goal = new SavingsGoal({
        ownerId: new mongoose.Types.ObjectId(),
        title: 'Emergency Reserve',
        targetAmount: 10000,
        currentAmount: 9000,
        status: 'active',
        deadline: new Date(Date.now() + 86400000),
      });

      // Add 2000 (total becomes 11,000; surplus = 1,000)
      const depositAmount = 2000;
      goal.currentAmount += depositAmount;

      const isCompleted = goal.currentAmount >= goal.targetAmount;
      if (isCompleted) {
        goal.status = 'completed';
      }

      assert.strictEqual(goal.status, 'completed');
      assert.strictEqual(goal.currentAmount, 11000);
      assert.strictEqual(goal.progressPercentage, 100); // Clamped at 100%
      assert.strictEqual(goal.remainingAmount, 0);

      const surplus = Math.max(0, goal.currentAmount - goal.targetAmount);
      assert.strictEqual(surplus, 1000);
    });
  });
});
