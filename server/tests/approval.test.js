import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDocumentStatus } from '../src/lib/approval.js';

test('порожній маршрут → draft', () => {
  assert.equal(computeDocumentStatus([]), 'draft');
  assert.equal(computeDocumentStatus(null), 'draft');
});

test('усі pending → on_review', () => {
  assert.equal(
    computeDocumentStatus([{ decision: 'pending' }, { decision: 'pending' }]),
    'on_review'
  );
});

test('частково погоджено → on_review', () => {
  assert.equal(
    computeDocumentStatus([{ decision: 'approved' }, { decision: 'pending' }]),
    'on_review'
  );
});

test('усі погоджено → approved', () => {
  assert.equal(
    computeDocumentStatus([{ decision: 'approved' }, { decision: 'approved' }]),
    'approved'
  );
});

test('будь-яке відхилення → rejected (пріоритет над рештою)', () => {
  assert.equal(
    computeDocumentStatus([{ decision: 'approved' }, { decision: 'rejected' }]),
    'rejected'
  );
  assert.equal(
    computeDocumentStatus([{ decision: 'rejected' }, { decision: 'pending' }]),
    'rejected'
  );
});
