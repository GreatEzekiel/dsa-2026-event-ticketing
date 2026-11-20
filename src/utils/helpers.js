// Format kobo/cents to Naira (e.g., 250000 -> ₦2,500)
export function formatCurrency(amountCents) {
  if (typeof amountCents !== 'number' || Number.isNaN(amountCents)) return '₦0';
  const naira = Math.floor(amountCents / 100);
  return `₦${naira.toLocaleString('en-NG')}`;
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// Build 8: Refund Policy Calculation (>=7d: 100%, >=2d: 50%, <2d: 0%)
export function calculateRefund({ amountCents, startsAt, now = Date.now() }) {
  const startMs = new Date(startsAt).getTime();
  const diffMs = startMs - now;

  if (diffMs <= 0) {
    return { allowed: false, reason: 'Event has already started.', refundCents: 0, percentage: 0 };
  }

  const daysUntilStart = diffMs / (1000 * 60 * 60 * 24);
  if (daysUntilStart >= 7) {
    return { allowed: true, refundCents: amountCents, percentage: 100 };
  }
  if (daysUntilStart >= 2) {
    return { allowed: true, refundCents: Math.floor(amountCents * 0.5), percentage: 50 };
  }
  return { allowed: true, refundCents: 0, percentage: 0 };
}

// Generate readable booking reference (Build 1)
export function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TKT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Simulated HMAC-like signed QR payload (Build 9)
export function signTicketToken({ reference, eventId }) {
  const payload = btoa(JSON.stringify({ ref: reference, eventId, iat: Date.now() }));
  const sig = btoa(`HMAC_SHA256_${reference}_${eventId}`).slice(0, 16);
  return `${payload}.${sig}`;
}

export function verifyTicketToken(token) {
  try {
    const [payloadB64, sig] = token.trim().split('.');
    if (!payloadB64 || !sig) return null;
    const payload = JSON.parse(atob(payloadB64));
    const expectedSig = btoa(`HMAC_SHA256_${payload.ref}_${payload.eventId}`).slice(0, 16);
    if (sig !== expectedSig) return null;
    return payload;
  } catch {
    return null;
  }
}