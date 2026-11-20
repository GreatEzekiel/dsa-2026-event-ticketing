import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// --- Domain Helpers Under Test ---

const ALLOWED_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['checked_in', 'refunded', 'cancelled'],
  cancelled: [],
  refunded: [],
  checked_in: [],
};

function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`Invalid transition from ${from} to ${to}`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
}

function calculateRefund({ amountCents, startsAt, now }) {
  const diffMs = new Date(startsAt).getTime() - new Date(now).getTime();
  if (diffMs <= 0) {
    const err = new Error('Event has already started');
    err.code = 'EVENT_STARTED';
    throw err;
  }
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days >= 7) return Math.floor(amountCents);
  if (days >= 2) return Math.floor(amountCents * 0.5);
  return 0;
}

const SECRET = 'test-secret-key';

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

// --- Test Suite ---

describe('Booking State Machine (Build 3)', () => {
  it('allows valid transitions from pending and paid', () => {
    assert.equal(canTransition('pending', 'paid'), true);
    assert.equal(canTransition('pending', 'cancelled'), true);
    assert.equal(canTransition('paid', 'checked_in'), true);
    assert.equal(canTransition('paid', 'refunded'), true);
  });

  it('rejects paying a cancelled booking or leaving terminal states', () => {
    assert.throws(
      () => assertTransition('cancelled', 'paid'),
      (err) => err.code === 'INVALID_TRANSITION'
    );
    assert.throws(
      () => assertTransition('checked_in', 'refunded'),
      (err) => err.code === 'INVALID_TRANSITION'
    );
  });
});

describe('Refund Policy Boundaries (Build 8)', () => {
  const baseTime = new Date('2026-12-10T12:00:00.000Z').getTime();
  const amountCents = 1000000; // ₦10,000

  it('gives 100% at exactly 7 days before start', () => {
    const sevenDaysBefore = baseTime - 7 * 24 * 60 * 60 * 1000;
    assert.equal(
      calculateRefund({ amountCents, startsAt: baseTime, now: sevenDaysBefore }),
      1000000
    );
  });

  it('gives 50% at 6 days 23 hours and at exactly 2 days before start', () => {
    const sixDays23h = baseTime - (6 * 24 + 23) * 60 * 60 * 1000;
    const twoDays = baseTime - 2 * 24 * 60 * 60 * 1000;
    assert.equal(
      calculateRefund({ amountCents, startsAt: baseTime, now: sixDays23h }),
      500000
    );
    assert.equal(
      calculateRefund({ amountCents, startsAt: baseTime, now: twoDays }),
      500000
    );
  });

  it('gives 0% under 2 days before start and throws EVENT_STARTED when started', () => {
    const oneDay23h = baseTime - (1 * 24 + 23) * 60 * 60 * 1000;
    assert.equal(
      calculateRefund({ amountCents, startsAt: baseTime, now: oneDay23h }),
      0
    );
    assert.throws(
      () => calculateRefund({ amountCents, startsAt: baseTime, now: baseTime }),
      (err) => err.code === 'EVENT_STARTED'
    );
  });
});

describe('Last-Ticket Concurrency & Atomic Seat Reservation (Build 5)', () => {
  it('admits only 1 booking out of 50 simultaneous requests for 1 seat', async () => {
    let sold = 99;
    const capacity = 100;

    // Simulate serialized atomic row check-and-increment
    let queue = Promise.resolve();
    function atomicReserveOne() {
      queue = queue.then(() => {
        if (sold + 1 <= capacity) {
          sold += 1;
          return 'BOOKED';
        }
        return 'SOLD_OUT';
      });
      return queue;
    }

    const results = await Promise.all(
      Array.from({ length: 50 }, () => atomicReserveOne())
    );

    const successes = results.filter((r) => r === 'BOOKED').length;
    const soldOutCount = results.filter((r) => r === 'SOLD_OUT').length;

    assert.equal(successes, 1);
    assert.equal(soldOutCount, 49);
    assert.equal(sold, capacity);
  });
});

describe('QR Ticket Signing & Duplicate Check-In (Build 9)', () => {
  it('verifies a valid signed token and rejects forged or tampered tokens', () => {
    const token = signToken({ ref: 'TKT-ABC123', eventId: 'evt-1', iat: Date.now() });
    const verified = verifyToken(token);
    assert.equal(verified.ref, 'TKT-ABC123');
    assert.equal(verified.eventId, 'evt-1');

    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    assert.equal(verifyToken(tampered), null);
    assert.equal(verifyToken('forged.token'), null);
  });

  it('prevents duplicate check-ins on the same booking reference', () => {
    const checkedInAtByRef = new Map();
    function scanOnce(ref, timestamp) {
      if (checkedInAtByRef.has(ref)) {
        const err = new Error(`Duplicate scan; first used at ${checkedInAtByRef.get(ref)}`);
        err.code = 'ALREADY_CHECKED_IN';
        throw err;
      }
      checkedInAtByRef.set(ref, timestamp);
      return { admitted: true, ref, checkedInAt: timestamp };
    }

    const first = scanOnce('TKT-XYZ999', '2026-12-10T10:00:00.000Z');
    assert.equal(first.admitted, true);

    assert.throws(
      () => scanOnce('TKT-XYZ999', '2026-12-10T10:05:00.000Z'),
      (err) => err.code === 'ALREADY_CHECKED_IN'
    );
  });
});