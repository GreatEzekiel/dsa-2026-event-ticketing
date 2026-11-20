const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, { method = 'GET', body, user } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    headers['x-user-email'] = user.email;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error?.code || 'Request failed');
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  listEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },
  listBookings: (user) => request('/api/bookings', { user }),
  createEvent: (payload, user) =>
    request('/api/events', { method: 'POST', body: payload, user }),
  addTier: (eventId, payload, user) =>
    request(`/api/events/${eventId}/tiers`, { method: 'POST', body: payload, user }),
  togglePublish: (eventId, user) =>
    request(`/api/events/${eventId}/publish`, { method: 'POST', user }),
  createBooking: (payload, user) =>
    request('/api/bookings', { method: 'POST', body: payload, user }),
  payBooking: (reference, payload, user) =>
    request(`/api/bookings/${reference}/pay`, { method: 'POST', body: payload, user }),
  cancelBooking: (reference, user) =>
    request(`/api/bookings/${reference}/cancel`, { method: 'POST', user }),
  checkinTicket: (payload, user) =>
    request('/api/checkin', { method: 'POST', body: payload, user }),
};
