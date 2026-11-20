import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === 'undefined') return null;
      const saved = JSON.parse(window.localStorage.getItem('eventpulse.session') || 'null');
      return saved?.token ? saved : null;
    } catch {
      return null;
    }
  });

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoadError, setBookingLoadError] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [activeCheckoutId, setActiveCheckoutId] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [apiError, setApiError] = useState(null);

  const refreshEvents = useCallback(async (filters = {}) => {
    setLoadingEvents(true);
    setApiError(null);
    try {
      const data = await api.listEvents(filters);
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const refreshBookings = useCallback(async (currentUser) => {
    if (!currentUser) {
      setBookings([]);
      setBookingLoadError(null);
      return;
    }
    setBookingLoadError(null);
    try {
      const data = await api.listBookings(currentUser);
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      setBookings([]);
      setBookingLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (user) refreshBookings(user);
  }, [user, refreshBookings]);

  const saveSession = async (authRequest) => {
    const response = await authRequest;
    const nextUser = response.user;
    nextUser.name = nextUser.email.split('@')[0];
    window.localStorage.setItem('eventpulse.session', JSON.stringify(nextUser));
    setUser(nextUser);
    await refreshBookings(nextUser);
    await refreshEvents();
    return nextUser;
  };

  const login = (email, password) => saveSession(api.login({ email, password }));
  const signup = (email, password, role) =>
    saveSession(api.signup({ email, password, role }));

  const logout = () => {
    window.localStorage.removeItem('eventpulse.session');
    setUser(null);
    setBookings([]);
    setActiveCheckoutId(null);
    setWaitlist([]);
  };

  // Organizer Actions -> MySQL via Express API
  const createEvent = async ({ title, city, venue, startsAt }) => {
    if (!user) throw new Error('Please log in first.');
    const created = await api.createEvent({ title, city, venue, startsAt }, user);
    await refreshEvents();
    return created;
  };

  const addTier = async (eventId, { name, priceCents, capacity }) => {
    if (!user) throw new Error('Please log in first.');
    const tier = await api.addTier(eventId, { name, priceCents, capacity }, user);
    await refreshEvents();
    return tier;
  };

  const togglePublishEvent = async (eventId) => {
    if (!user) throw new Error('Please log in first.');
    const updated = await api.togglePublish(eventId, user);
    await refreshEvents();
    return updated;
  };

  // Attendee Booking -> Atomic Seat Reservation in MySQL
  const createBooking = async ({ eventId, tierId, quantity }) => {
    if (!user) throw new Error('Please log in to book tickets.');
    const booking = await api.createBooking({ eventId, tierId, quantity }, user);
    setBookings((prev) => [booking, ...prev]);
    setActiveCheckoutId(booking.id);
    await refreshEvents();
    return booking;
  };

  // Mock Payment -> Signs QR Token in Backend
  const payBooking = async (bookingId, { simulateDecline = false } = {}) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) throw new Error('Booking not found.');
    const paid = await api.payBooking(target.reference, { simulateDecline }, user);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: paid.status || 'paid', qrToken: paid.qrToken }
          : b
      )
    );
    setActiveCheckoutId(null);
    return paid;
  };

  // Cancel & Refund -> Releases Seats in MySQL
  const cancelBooking = async (bookingId) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) throw new Error('Booking not found.');
    const res = await api.cancelBooking(target.reference, user);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: res.status, refundedCents: res.refundedCents ?? 0 }
          : b
      )
    );
    await refreshEvents();
    return res;
  };

  // Waitlist Actions
  const joinWaitlist = (eventId, tierId) => {
    if (!user) throw new Error('Login required.');
    const event = events.find((e) => e.id === eventId);
    const tier = event?.tiers.find((t) => t.id === tierId);
    if (!tier || tier.sold < tier.capacity) {
      throw new Error('NOT_SOLD_OUT: Tickets are still available.');
    }
    const duplicate = waitlist.find(
      (w) => w.userId === user.id && w.tierId === tierId && ['waiting', 'offered'].includes(w.status)
    );
    if (duplicate) throw new Error('ALREADY_ON_WAITLIST: You are already in line.');

    setWaitlist((prev) => [
      ...prev,
      {
        id: `wl-${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        eventId,
        eventTitle: event.title,
        tierId,
        tierName: tier.name,
        status: 'waiting',
        offerExpiresAt: null,
      },
    ]);
  };

  const acceptWaitlistOffer = async (waitlistId) => {
    const offer = waitlist.find((w) => w.id === waitlistId);
    if (!offer || offer.status !== 'offered') throw new Error('Offer not found.');
    if (Date.now() > offer.offerExpiresAt) throw new Error('OFFER_EXPIRED: Your offer timed out.');

    const booking = await createBooking({
      eventId: offer.eventId,
      tierId: offer.tierId,
      quantity: 1,
    });
    setWaitlist((prev) =>
      prev.map((w) => (w.id === waitlistId ? { ...w, status: 'accepted' } : w))
    );
    return booking;
  };

  // Staff QR Check-In -> Atomic Single-Entry Check in MySQL
  const checkinTicket = async ({ token, targetEventId }) => {
    if (user?.role !== 'staff') {
      throw new Error('FORBIDDEN: Only staff accounts can scan tickets.');
    }
    const result = await api.checkinTicket({ token, targetEventId }, user);
    setBookings((prev) =>
      prev.map((b) =>
        b.reference === result.reference
          ? { ...b, status: 'checked_in', checkedInAt: result.checkedInAt }
          : b
      )
    );
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        events,
        loadingEvents,
        apiError,
        refreshEvents,
        bookings,
        bookingLoadError,
        waitlist,
        activeCheckoutId,
        setActiveCheckoutId,
        createEvent,
        addTier,
        togglePublishEvent,
        createBooking,
        payBooking,
        cancelBooking,
        joinWaitlist,
        acceptWaitlistOffer,
        checkinTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
