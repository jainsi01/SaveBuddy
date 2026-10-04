process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const mongoose = require('mongoose');
const app = require('../src/server');

let testServer;
const TEST_PORT = 5001;

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe('Module 1: Foundation & Health Endpoint Verification', () => {
  before(async () => {
    await new Promise((resolve) => {
      testServer = app.listen(TEST_PORT, resolve);
    });
  });

  after(async () => {
    await new Promise((resolve) => testServer.close(resolve));
    await mongoose.disconnect();
  });

  test('GET / returns root API greeting and version', async () => {
    const res = await makeRequest({ method: 'GET', path: '/' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('SaveBuddy API is online'));
  });

  test('GET /api/health returns standardized health response (EC-1.2)', async () => {
    const res = await makeRequest({ method: 'GET', path: '/api/health' });
    assert.ok(res.status === 200 || res.status === 503);
    assert.ok(res.body.status === 'UP' || res.body.status === 'DEGRADED');
    assert.ok(res.body.database === 'CONNECTED' || res.body.database === 'DISCONNECTED');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
    assert.ok(typeof res.body.timestamp === 'string');
  });

  test('GET /api/unmapped-route returns 404 with standardized error envelope', async () => {
    const res = await makeRequest({ method: 'GET', path: '/api/non-existent-test-route' });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ROUTE_NOT_FOUND');
    assert.ok(res.body.error.message.includes('Cannot GET'));
  });

  test('POST / with malformed JSON body returns 400 INVALID_JSON_BODY (EC-1.3)', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/health',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed_json: true, }', // Invalid JSON string
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_JSON_BODY');
  });
});
