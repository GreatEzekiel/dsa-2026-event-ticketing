import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';

export default function CheckoutPage({ onSuccess, onCancel, onLater }) {
  const { bookings, activeCheckoutId, payBooking, cancelBooking } = useApp();
  const booking = bookings.find((b) => b.id === activeCheckoutId);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((booking.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    updateCountdown();
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  if (!booking || booking.status !== 'pending') {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-slate-200 text-center">
        <p className="text-slate-700 font-medium">No active pending booking found or hold expired.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const days = Math.floor(secondsLeft / 86400);
  const hours = String(Math.floor((secondsLeft % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handlePay = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await payBooking(booking.id, { simulateDecline });
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Complete Payment</h1>
          <p className="text-xs text-slate-500">Ref: {booking.reference}</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm font-mono font-bold">
          Due: {days > 0 ? `${days}d ` : ''}{hours}:{mins}:{secs}
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-600">
        Your seats are reserved. You can pay now or return to <strong>My Registered Events</strong> and pay any time before the event starts.
      </p>

      {secondsLeft === 0 && (
        <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          The event has started, so this reservation can no longer be paid. Release it to return the seats.
        </p>
      )}

      <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-1">
        <p className="font-bold text-slate-900">{booking.eventTitle}</p>
        <p className="text-slate-600">
          {booking.quantity} × {booking.tierName}
        </p>
        <p className="text-lg font-extrabold text-emerald-700 pt-2">
          Total: {formatCurrency(booking.totalCents)}
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handlePay} className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            id="decline-toggle"
            type="checkbox"
            checked={simulateDecline}
            onChange={(e) => setSimulateDecline(e.target.checked)}
            className="h-4 w-4 accent-rose-600"
          />
          <label htmlFor="decline-toggle" className="text-sm text-slate-700">
            Simulate declined mock card (Test S07 retry flow)
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await cancelBooking(booking.id);
                onCancel();
              } catch (err) {
                setError(err.message);
              }
            }}
            className="flex-1 basis-1/4 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Release Hold
          </button>
          <button
            type="button"
            onClick={onLater}
            className="flex-1 basis-1/4 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Pay Later
          </button>
          <button
            type="submit"
            disabled={secondsLeft === 0}
            className="flex-1 basis-1/3 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            Pay {formatCurrency(booking.totalCents)}
          </button>
        </div>
      </form>
    </section>
  );
}
