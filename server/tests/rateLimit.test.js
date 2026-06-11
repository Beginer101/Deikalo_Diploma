import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../src/middleware/rateLimit.js';

// Заглушка res із підтримкою set/status/json
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    set(k, v) {
      if (typeof k === 'object') Object.assign(this.headers, k);
      else this.headers[k] = v;
      return this;
    },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('rateLimit: пропускає запити в межах ліміту', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 3 });
  const req = { ip: '10.0.0.1' };
  let passed = 0;
  for (let i = 0; i < 3; i++) {
    limiter(req, mockRes(), () => { passed += 1; });
  }
  assert.equal(passed, 3);
});

test('rateLimit: блокує запити понад ліміт (429)', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });
  const req = { ip: '10.0.0.2' };
  limiter(req, mockRes(), () => {});
  limiter(req, mockRes(), () => {});

  const res = mockRes();
  let nextCalled = false;
  limiter(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);
});

test('rateLimit: рахує ліміти окремо для різних IP', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  limiter({ ip: '10.0.0.3' }, mockRes(), () => {});

  const res = mockRes();
  let nextCalled = false;
  limiter({ ip: '10.0.0.4' }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('rateLimit: вікно скидається після завершення windowMs', async () => {
  const limiter = rateLimit({ windowMs: 50, max: 1 });
  const req = { ip: '10.0.0.5' };
  limiter(req, mockRes(), () => {});

  const blocked = mockRes();
  limiter(req, blocked, () => {});
  assert.equal(blocked.statusCode, 429);

  await new Promise((r) => setTimeout(r, 60));

  const res = mockRes();
  let nextCalled = false;
  limiter(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('rateLimit: виставляє інформаційні заголовки X-RateLimit-*', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 5 });
  const res = mockRes();
  limiter({ ip: '10.0.0.6' }, res, () => {});
  assert.equal(res.headers['X-RateLimit-Limit'], '5');
  assert.equal(res.headers['X-RateLimit-Remaining'], '4');
});
