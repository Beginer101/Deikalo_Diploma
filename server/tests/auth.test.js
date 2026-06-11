import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate, authenticateSSE, authorize } from '../src/middleware/auth.js';
import { config } from '../src/config/env.js';

// Той самий секрет, що й у middleware (у dev може бути згенерований випадково)
const SECRET = config.jwt.secret;

// Хелпери-заглушки для req/res
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('authenticate: відхиляє запит без токена', () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;
  authenticate(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('authenticate: приймає валідний токен і кладе user у req', () => {
  const token = jwt.sign({ id: 7, role: 'admin' }, SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  authenticate(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 7);
  assert.equal(req.user.role, 'admin');
});

test('authenticate: відхиляє підроблений токен', () => {
  const req = { headers: { authorization: 'Bearer abc.def.ghi' } };
  const res = mockRes();
  authenticate(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('authorize: пропускає дозволену роль', () => {
  const req = { user: { role: 'admin' } };
  const res = mockRes();
  let nextCalled = false;
  authorize('admin', 'head')(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('authorize: блокує недозволену роль (403)', () => {
  const req = { user: { role: 'member' } };
  const res = mockRes();
  authorize('admin')(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test('authenticateSSE: приймає валідний токен із query-параметра', () => {
  const token = jwt.sign({ id: 3, role: 'member' }, SECRET);
  const req = { query: { token } };
  const res = mockRes();
  let nextCalled = false;
  authenticateSSE(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 3);
});

test('authenticateSSE: відхиляє запит без токена (401)', () => {
  const req = { query: {} };
  const res = mockRes();
  authenticateSSE(req, res, () => {});
  assert.equal(res.statusCode, 401);
});
