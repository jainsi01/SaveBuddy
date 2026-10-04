process.env.NODE_ENV = 'test';
process.env.PORT = '5003';
process.env.JWT_SECRET = 'savebuddy_test_secret_key_goals';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const SavingsGoal = require('../src/models/SavingsGoal');
const {
  validateCreateGoal,
  validateUpdateGoal,
} = require('../src/middleware/validators/goalValidator');

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

describe('Module 3: Core Savings Goals Management Verification', () => {
  // 1. Goal Creation Validation Tests
  describe('Goal Input Validation (EC-3.1, EC-3.2, EC-3.3)', () => {
    test('validateCreateGoal rejects missing or short title', () => {
      const { req, res, next, getError } = createMockReqRes({
        title: 'Go',
        targetAmount: 50000,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

      validateCreateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_TITLE');
    });

    test('validateCreateGoal rejects non-positive target amount (EC-3.1)', () => {
      const { req, res, next, getError } = createMockReqRes({
        title: 'Emergency Fund',
        targetAmount: -500,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

      validateCreateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_TARGET_AMOUNT');
    });

    test('validateCreateGoal rejects target amount = 0 (EC-3.1)', () => {
      const { req, res, next, getError } = createMockReqRes({
        title: 'Emergency Fund',
        targetAmount: 0,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

      validateCreateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_TARGET_AMOUNT');
    });

    test('validateCreateGoal rejects past deadline (EC-3.3)', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const { req, res, next, getError } = createMockReqRes({
        title: 'Emergency Fund',
        targetAmount: 50000,
        deadline: pastDate,
      });

      validateCreateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'DEADLINE_NOT_IN_FUTURE');
    });

    test('validateCreateGoal rejects invalid category', () => {
      const { req, res, next, getError } = createMockReqRes({
        title: 'Emergency Fund',
        targetAmount: 50000,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        category: 'unsupported_category_name',
      });

      validateCreateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_CATEGORY');
    });

    test('validateCreateGoal passes valid input and normalizes category and numbers', () => {
      const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
      const { req, res, next, getError } = createMockReqRes({
        title: '  Goa Trip 2027  ',
        targetAmount: '50000.555',
        category: 'TRAVEL',
        deadline: futureDate,
        initialContribution: '5000',
      });

      validateCreateGoal(req, res, next);
      assert.strictEqual(getError(), null);
      assert.strictEqual(req.body.title, 'Goa Trip 2027');
      assert.strictEqual(req.body.targetAmount, 50000.56);
      assert.strictEqual(req.body.category, 'travel');
      assert.strictEqual(req.body.initialContribution, 5000);
    });
  });

  // 2. SavingsGoal Model Virtuals & Mathematical Calculations
  describe('SavingsGoal Model & Calculations (FR-05, EC-3.1, EC-3.5)', () => {
    test('progressPercentage calculates ratio and clamps at 100% (EC-3.1, EC-3.5)', () => {
      const goalUnder = new SavingsGoal({
        ownerId: new mongoose.Types.ObjectId(),
        title: 'MacBook',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: new Date(Date.now() + 86400000),
      });
      assert.strictEqual(goalUnder.progressPercentage, 25);
      assert.strictEqual(goalUnder.remainingAmount, 75000);

      // Overfunded goal (current > target)
      const goalOver = new SavingsGoal({
        ownerId: new mongoose.Types.ObjectId(),
        title: 'Emergency',
        targetAmount: 50000,
        currentAmount: 60000,
        deadline: new Date(Date.now() + 86400000),
      });
      // Progress clamped to 100%
      assert.strictEqual(goalOver.progressPercentage, 100);
      // Remaining clamped to 0
      assert.strictEqual(goalOver.remainingAmount, 0);
    });

    test('daysRemaining calculates days to deadline correctly (EC-3.4)', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // exactly 10 days
      const goal = new SavingsGoal({
        ownerId: new mongoose.Types.ObjectId(),
        title: 'Trip',
        targetAmount: 20000,
        deadline: futureDate,
      });

      assert.strictEqual(goal.daysRemaining, 10);
    });

    test('toJSON serializes goal with virtual properties and clean id', () => {
      const goal = new SavingsGoal({
        ownerId: new mongoose.Types.ObjectId(),
        title: 'Vehicle Fund',
        targetAmount: 200000,
        currentAmount: 50000,
        deadline: new Date(Date.now() + 86400000),
      });

      const json = goal.toJSON();
      assert.strictEqual(json.__v, undefined);
      assert.strictEqual(json._id, undefined);
      assert.ok(json.id);
      assert.strictEqual(json.progressPercentage, 25);
      assert.strictEqual(json.remainingAmount, 150000);
    });
  });

  // 3. Goal Update Validation
  describe('Goal Update Validation (EC-3.5)', () => {
    test('validateUpdateGoal validates target amount and title', () => {
      const { req, res, next, getError } = createMockReqRes({
        targetAmount: -100,
      });

      validateUpdateGoal(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_TARGET_AMOUNT');
    });

    test('validateUpdateGoal accepts valid updates', () => {
      const { req, res, next, getError } = createMockReqRes({
        title: 'Updated Goal Title',
        targetAmount: 80000,
      });

      validateUpdateGoal(req, res, next);
      assert.strictEqual(getError(), null);
      assert.strictEqual(req.body.title, 'Updated Goal Title');
      assert.strictEqual(req.body.targetAmount, 80000);
    });
  });
});
