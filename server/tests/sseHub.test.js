import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subscribe, publish, connectionCount } from '../src/lib/sseHub.js';

// Заглушка SSE-відповіді, що накопичує записані дані
function mockSseRes() {
  return {
    chunks: [],
    write(chunk) { this.chunks.push(chunk); },
  };
}

test('sseHub: publish доставляє подію підписаному користувачу', () => {
  const res = mockSseRes();
  const unsubscribe = subscribe(101, res);

  const sent = publish(101, 'notification', { message: 'Тест' });
  assert.equal(sent, 1);
  assert.equal(res.chunks.length, 1);
  assert.ok(res.chunks[0].startsWith('event: notification\n'));
  assert.ok(res.chunks[0].includes('"message":"Тест"'));

  unsubscribe();
});

test('sseHub: publish без підписників повертає 0', () => {
  assert.equal(publish(999, 'notification', {}), 0);
});

test('sseHub: подія не доставляється чужому користувачу', () => {
  const res = mockSseRes();
  const unsubscribe = subscribe(102, res);

  publish(103, 'notification', { message: 'не для 102' });
  assert.equal(res.chunks.length, 0);

  unsubscribe();
});

test('sseHub: кілька з\'єднань одного користувача отримують подію', () => {
  const res1 = mockSseRes();
  const res2 = mockSseRes();
  const un1 = subscribe(104, res1);
  const un2 = subscribe(104, res2);

  assert.equal(connectionCount(104), 2);
  const sent = publish(104, 'notification', { message: 'обом' });
  assert.equal(sent, 2);
  assert.equal(res1.chunks.length, 1);
  assert.equal(res2.chunks.length, 1);

  un1();
  un2();
  assert.equal(connectionCount(104), 0);
});

test('sseHub: після відписки події не надходять', () => {
  const res = mockSseRes();
  const unsubscribe = subscribe(105, res);
  unsubscribe();

  assert.equal(publish(105, 'notification', {}), 0);
  assert.equal(res.chunks.length, 0);
});
