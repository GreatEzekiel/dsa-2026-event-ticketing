import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// Security headers (Build 9)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_ticketing',
  waitForConnections: true,
  connectionLimit: 10,
});

const TICKET_SECRET = process.env.TICKET_SECRET || 'dev-ticket-secret-change-in-prod';

class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function newReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = 'TKT-';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function signTicketToken({ reference, eventId }) {
  const payload = Buffer.from(
    JSON.stringify({ ref: reference, eventId, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TICKET_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyTicketToken(token) {
  const parts = (token || '').trim().split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', TICKET_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function calculateRefund({ amountCents, startsAt, now = Date.now() }) {
  const diffMs = new Date(startsAt).getTime() - now;
  if (diffMs <= 0) {
    throw new ApiError('EVENT_STARTED', 'Event has already started.', 409);
  }
  const daysUntilStart = diffMs / (1000 * 60 * 60 * 24);
  if (daysUntilStart >= 7) return { refundCents: amountCents, percentage: 100 };
  if (daysUntilStart >= 2) return { refundCents: Math.floor(amountCents * 0.5), percentage: 50 };
  return { refundCents: 0, percentage: 0 };
}

// Lightweight auth/role middleware (supports Bearer token or x-user-id / x-user-role headers)
async function attachUser(req, res, next) {
  const userId = req.header('x-user-id') || 'usr-101';
  const role = req.header('x-user-role') || 'attendee';
  const email = req.header('x-user-email') || `${userId}@example.com`;

  await pool.execute(
    'INSERT IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [userId, email, 'scrypt-managed', role]
  );
  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  req.user = { id: userId, email, role };
  next();
}

app.use('/api', attachUser);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/events (search, filter, sort)
app.get('/api/events', async (req, res, next) => {
  try {
    const { q = '', city = 'ALL', maxPriceCents = '', sortBy = 'date' } = req.query;
    const [events] = await pool.query('SELECT * FROM events WHERE published = TRUE');
    const [tiers] = await pool.query('SELECT * FROM ticket_tiers');

    let list = events.map((ev) => ({
      id: ev.id,
      organizerId: ev.organizer_id,
      title: ev.title,
      city: ev.city,
      venue: ev.venue,
      startsAt: new Date(ev.starts_at).toISOString(),
      published: Boolean(ev.published),
      tiers: tiers
        .filter((t) => t.event_id === ev.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          priceCents: Number(t.price_cents),
          capacity: Number(t.capacity),
          sold: Number(t.sold),
        })),
    }));

    if (String(q).trim()) {
      const needle = String(q).toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(needle) || e.venue.toLowerCase().includes(needle)
      );
    }

    if (city && String(city).toUpperCase() !== 'ALL') {
      list = list.filter((e) => e.city.toLowerCase() === String(city).toLowerCase());
    }

    if (maxPriceCents !== '') {
      const cap = Number(maxPriceCents);
      if (!Number.isInteger(cap) || cap < 0) {
        throw new ApiError('VALIDATION', 'maxPriceCents must be a non-negative integer.', 400);
      }
      list = list.filter((e) => {
        if (e.tiers.length === 0) return false;
        const cheapest = Math.min(...e.tiers.map((t) => t.priceCents));
        return cheapest <= cap;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'price') {
        const pa = a.tiers.length ? Math.min(...a.tiers.map((t) => t.priceCents)) : Infinity;
        const pb = b.tiers.length ? Math.min(...b.tiers.map((t) => t.priceCents)) : Infinity;
        return pa - pb || a.title.localeCompare(b.title);
      }
      if (sortBy === 'availability') {
        const aa = a.tiers.reduce((s, t) => s + (t.capacity - t.sold), 0);
        const ab = b.tiers.reduce((s, t) => s + (t.capacity - t.sold), 0);
        return ab - aa || a.title.localeCompare(b.title);
      }
      return new Date(a.startsAt) - new Date(b.startsAt) || a.title.localeCompare(b.title);
    });

    res.json({ events: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/events (organizer only)
app.post('/api/events', async (req, res, next) => {
  try {
    if (req.user.role !== 'organizer') {
      throw new ApiError('FORBIDDEN', 'Only organizers can create events.', 403);
    }
    const { title, city, venue, startsAt } = req.body;
    if (!title || !city || !venue || !startsAt || Number.isNaN(Date.parse(startsAt))) {
      throw new ApiError('VALIDATION', 'title, city, venue, and valid startsAt are required.', 400);
    }
    const id = `evt-${crypto.randomUUID().slice(0, 8)}`;
    await pool.execute(
      'INSERT INTO events (id, organizer_id, title, city, venue, starts_at, published) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
      [id, req.user.id, title.trim(), city.trim(), venue.trim(), new Date(startsAt)]
    );
    res.status(201).json({ id, title, city, venue, startsAt, published: false, tiers: [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/tiers
app.post('/api/events/:id/tiers', async (req, res, next) => {
  try {
    if (req.user.role !== 'organizer') {
      throw new ApiError('FORBIDDEN', 'Only organizers can add ticket tiers.', 403);
    }
    const { name, priceCents, capacity } = req.body;
    if (!name || !Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(capacity) || capacity < 1) {
      throw new ApiError('VALIDATION', 'Invalid tier name, priceCents, or capacity.', 400);
    }
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) throw new ApiError('NOT_FOUND', 'Event not found.', 404);
    if (rows[0].organizer_id !== req.user.id) {
      throw new ApiError('FORBIDDEN', 'Cannot modify another organizer event.', 403);
    }

    const tierId = `tier-${crypto.randomUUID().slice(0, 8)}`;
    await pool.execute(
      'INSERT INTO ticket_tiers (id, event_id, name, price_cents, capacity, sold) VALUES (?, ?, ?, ?, ?, 0)',
      [tierId, req.params.id, name.trim(), priceCents, capacity]
    );
    res.status(201).json({ id: tierId, name, priceCents, capacity, sold: 0 });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/publish
app.post('/api/events/:id/publish', async (req, res, next) => {
  try {
    if (req.user.role !== 'organizer') {
      throw new ApiError('FORBIDDEN', 'Only organizers can publish events.', 403);
    }
    const [evRows] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (evRows.length === 0) throw new ApiError('NOT_FOUND', 'Event not found.', 404);
    if (evRows[0].organizer_id !== req.user.id) {
      throw new ApiError('FORBIDDEN', 'Cannot publish another organizer event.', 403);
    }

    const [tierRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM ticket_tiers WHERE event_id = ?',
      [req.params.id]
    );
    if (tierRows[0].cnt === 0) {
      throw new ApiError('INVALID_STATE', 'Cannot publish an event with no ticket tiers.', 409);
    }

    const nextPublished = !Boolean(evRows[0].published);
    await pool.execute('UPDATE events SET published = ? WHERE id = ?', [nextPublished, req.params.id]);
    res.json({ id: req.params.id, published: nextPublished });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings (signed-in user's booking history)
app.get('/api/bookings', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, e.title AS event_title, e.starts_at, t.name AS tier_name
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       JOIN ticket_tiers t ON t.id = b.tier_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({
      bookings: rows.map((booking) => ({
        id: booking.id,
        reference: booking.reference_code,
        userId: booking.user_id,
        eventId: booking.event_id,
        eventTitle: booking.event_title,
        startsAt: new Date(booking.starts_at).toISOString(),
        tierId: booking.tier_id,
        tierName: booking.tier_name,
        quantity: Number(booking.quantity),
        totalCents: Number(booking.total_cents),
        refundedCents: Number(booking.refunded_cents),
        status: booking.status,
        expiresAt: Number(booking.expires_at),
        qrToken: booking.qr_token,
        checkedInAt: booking.checked_in_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings (Atomic MySQL seat reservation)
app.post('/api/bookings', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { eventId, tierId, quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new ApiError('VALIDATION', 'Quantity must be an integer between 1 and 10.', 400);
    }

    await conn.beginTransaction();

    const [tiers] = await conn.execute(
      `SELECT t.*, e.title AS event_title, e.starts_at
       FROM ticket_tiers t
       JOIN events e ON e.id = t.event_id
       WHERE t.id = ? AND t.event_id = ?`,
      [tierId, eventId]
    );
    if (tiers.length === 0) {
      throw new ApiError('NOT_FOUND', 'Ticket tier or event not found.', 404);
    }

    const [upd] = await conn.execute(
      'UPDATE ticket_tiers SET sold = sold + ? WHERE id = ? AND sold + ? <= capacity',
      [quantity, tierId, quantity]
    );
    if (upd.affectedRows === 0) {
      throw new ApiError('SOLD_OUT', 'Not enough seats remaining in this tier.', 409);
    }

    const id = `bk-${crypto.randomUUID().slice(0, 8)}`;
    const reference = newReference();
    const totalCents = Number(tiers[0].price_cents) * quantity;
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await conn.execute(
      `INSERT INTO bookings
       (id, reference_code, user_id, event_id, tier_id, quantity, total_cents, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, reference, req.user.id, eventId, tierId, quantity, totalCents, expiresAt]
    );

    await conn.commit();

    res.status(201).json({
      id,
      reference,
      userId: req.user.id,
      eventId,
      eventTitle: tiers[0].event_title,
      startsAt: new Date(tiers[0].starts_at).toISOString(),
      tierId,
      tierName: tiers[0].name,
      quantity,
      totalCents,
      status: 'pending',
      expiresAt,
      qrToken: null,
      checkedInAt: null,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/bookings/:reference/pay
app.post('/api/bookings/:reference/pay', async (req, res, next) => {
  try {
    const { simulateDecline = false } = req.body || {};
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE reference_code = ?',
      [req.params.reference]
    );
    if (rows.length === 0) throw new ApiError('NOT_FOUND', 'Booking not found.', 404);
    const bk = rows[0];
    if (bk.user_id !== req.user.id) throw new ApiError('FORBIDDEN', 'Not your booking.', 403);
    if (Date.now() > Number(bk.expires_at) && bk.status === 'pending') {
      throw new ApiError('BOOKING_EXPIRED', 'Seat hold has expired.', 409);
    }
    if (bk.status !== 'pending') {
      throw new ApiError('INVALID_TRANSITION', `Cannot pay booking in ${bk.status} state.`, 409);
    }
    if (simulateDecline) {
      throw new ApiError('PAYMENT_DECLINED', 'Mock card declined. Try again.', 402);
    }

    const qrToken = signTicketToken({ reference: bk.reference_code, eventId: bk.event_id });
    await pool.execute(
      'UPDATE bookings SET status = ?, qr_token = ? WHERE id = ? AND status = ?',
      ['paid', qrToken, bk.id, 'pending']
    );

    res.json({ reference: bk.reference_code, status: 'paid', qrToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:reference/cancel
app.post('/api/bookings/:reference/cancel', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT b.*, e.starts_at
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.reference_code = ?`,
      [req.params.reference]
    );
    if (rows.length === 0) throw new ApiError('NOT_FOUND', 'Booking not found.', 404);
    const bk = rows[0];
    if (bk.user_id !== req.user.id) throw new ApiError('FORBIDDEN', 'Not your booking.', 403);
    if (!['pending', 'paid'].includes(bk.status)) {
      throw new ApiError('INVALID_TRANSITION', 'Booking cannot be cancelled.', 409);
    }

    let refundedCents = 0;
    const nextStatus = bk.status === 'paid' ? 'refunded' : 'cancelled';
    if (bk.status === 'paid') {
      refundedCents = calculateRefund({
        amountCents: Number(bk.total_cents),
        startsAt: bk.starts_at,
      }).refundCents;
    }

    const [upd] = await conn.execute(
      'UPDATE bookings SET status = ?, refunded_cents = ? WHERE id = ? AND status = ?',
      [nextStatus, refundedCents, bk.id, bk.status]
    );
    if (upd.affectedRows === 1) {
      await conn.execute(
        'UPDATE ticket_tiers SET sold = GREATEST(0, sold - ?) WHERE id = ?',
        [bk.quantity, bk.tier_id]
      );
    }

    await conn.commit();
    res.json({ reference: bk.reference_code, status: nextStatus, refundedCents });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/checkin (staff only, atomic single check-in)
app.post('/api/checkin', async (req, res, next) => {
  try {
    if (req.user.role !== 'staff') {
      throw new ApiError('FORBIDDEN', 'Only staff can scan tickets.', 403);
    }
    const { token, targetEventId } = req.body;
    const payload = verifyTicketToken(token);
    if (!payload) throw new ApiError('INVALID_TICKET', 'Forged or invalid QR token.', 400);
    if (payload.eventId !== targetEventId) {
      throw new ApiError('WRONG_EVENT', 'QR token does not belong to this event.', 409);
    }

    const checkedInAt = new Date().toISOString();
    const [upd] = await pool.execute(
      "UPDATE bookings SET status = 'checked_in', checked_in_at = ? WHERE reference_code = ? AND status = 'paid'",
      [checkedInAt, payload.ref]
    );

    if (upd.affectedRows === 0) {
      const [existing] = await pool.execute(
        'SELECT status, checked_in_at FROM bookings WHERE reference_code = ?',
        [payload.ref]
      );
      if (existing.length === 0) throw new ApiError('NOT_FOUND', 'Booking not found.', 404);
      if (existing[0].status === 'checked_in') {
        throw new ApiError(
          'ALREADY_CHECKED_IN',
          `Already checked in at ${existing[0].checked_in_at}.`,
          409
        );
      }
      throw new ApiError('INVALID_TICKET', `Booking status is ${existing[0].status}.`, 409);
    }

    res.json({ admitted: true, reference: payload.ref, checkedInAt });
  } catch (err) {
    next(err);
  }
});

// Centralized error envelope
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Unexpected server error.',
    },
  });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
