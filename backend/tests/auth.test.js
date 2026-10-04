process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'savebuddy_test_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} = require('../src/middleware/validators/authValidator');
const { protect } = require('../src/middleware/authMiddleware');

// Helper to mock Express req, res, next
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

describe('Module 2: Authentication & User Management Verification', () => {
  // 1. Validator Tests
  describe('Input Validation & Boundary Conditions (EC-2.1, EC-2.3)', () => {
    test('validateRegister normalizes email to lowercase and trims whitespace (EC-2.1)', () => {
      const { req, res, next, getError } = createMockReqRes({
        name: '  Jane Doe  ',
        email: '  Jane.Doe@EXAMPLE.COM  ',
        password: 'SecurePassword123!',
        currencyPreference: 'inr',
      });

      validateRegister(req, res, next);
      assert.strictEqual(getError(), null);
      assert.strictEqual(req.body.name, 'Jane Doe');
      assert.strictEqual(req.body.email, 'jane.doe@example.com');
      assert.strictEqual(req.body.currencyPreference, 'INR');
    });

    test('validateRegister rejects invalid email syntax', () => {
      const { req, res, next, getError } = createMockReqRes({
        name: 'Jane Doe',
        email: 'invalid-email-address',
        password: 'SecurePassword123!',
      });

      validateRegister(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_EMAIL');
    });

    test('validateRegister rejects password shorter than 6 characters (EC-2.3)', () => {
      const { req, res, next, getError } = createMockReqRes({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '123',
      });

      validateRegister(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'PASSWORD_TOO_SHORT');
    });

    test('validateRegister rejects password longer than 72 characters (EC-2.3)', () => {
      const { req, res, next, getError } = createMockReqRes({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'A'.repeat(73),
      });

      validateRegister(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'PASSWORD_TOO_LONG');
    });

    test('validateRegister rejects whitespace-only password (EC-2.3)', () => {
      const { req, res, next, getError } = createMockReqRes({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '        ',
      });

      validateRegister(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'PASSWORD_WHITESPACE_ONLY');
    });

    test('validateLogin rejects empty email or password', () => {
      const { req, res, next, getError } = createMockReqRes({
        email: '',
        password: '',
      });

      validateLogin(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'EMAIL_REQUIRED');
    });

    test('validateProfileUpdate validates currency preference and income', () => {
      const { req, res, next, getError } = createMockReqRes({
        currencyPreference: 'USD',
        monthlyIncome: -500, // Invalid negative income
      });

      validateProfileUpdate(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.errorCode, 'INVALID_INCOME');
    });
  });

  // 2. User Model & Password Hashing Tests
  describe('User Model, Password Security & JWT (FR-01, EC-2.4)', () => {
    test('User toJSON serializes output without exposing passwordHash', () => {
      const userDoc = new User({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        passwordHash: 'hashed_password_string',
      });

      const json = userDoc.toJSON();
      assert.strictEqual(json.passwordHash, undefined);
      assert.strictEqual(json.__v, undefined);
      assert.ok(json.id);
      assert.strictEqual(json.name, 'Jane Doe');
      assert.strictEqual(json.email, 'jane.doe@example.com');
    });

    test('User generateAuthToken generates valid, verifiable JWT', () => {
      const userDoc = new User({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        passwordHash: 'dummy',
      });

      const token = userDoc.generateAuthToken();
      assert.ok(typeof token === 'string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.id, userDoc._id.toString());
      assert.strictEqual(decoded.email, userDoc.email);
    });

    test('User comparePassword correctly matches against bcrypt hash', async () => {
      const password = 'MySecretPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const userDoc = new User({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        passwordHash: hash,
      });

      const isMatch = await userDoc.comparePassword(password);
      const isMismatch = await userDoc.comparePassword('WrongPassword!');

      assert.strictEqual(isMatch, true);
      assert.strictEqual(isMismatch, false);
    });
  });

  // 3. Auth Middleware Tests
  describe('Auth Middleware & Stale Token Protection (EC-2.6, EC-2.7)', () => {
    test('protect rejects requests without Authorization header with 401 NO_TOKEN_PROVIDED', async () => {
      const { req, res, next, getError } = createMockReqRes();

      await protect(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.errorCode, 'NO_TOKEN_PROVIDED');
    });

    test('protect rejects forged/invalid token with 401 INVALID_TOKEN', async () => {
      const { req, res, next, getError } = createMockReqRes({}, {
        authorization: 'Bearer forged.invalid.token.here',
      });

      await protect(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.errorCode, 'INVALID_TOKEN');
    });

    test('protect rejects expired token with 401 TOKEN_EXPIRED', async () => {
      // Create an expired token (expired 10 seconds ago)
      const expiredToken = jwt.sign(
        { id: '67000101a1b2c3d4e5f60001', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: -10 }
      );

      const { req, res, next, getError } = createMockReqRes({}, {
        authorization: `Bearer ${expiredToken}`,
      });

      await protect(req, res, next);
      const err = getError();
      assert.ok(err);
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.errorCode, 'TOKEN_EXPIRED');
    });
  });
});
