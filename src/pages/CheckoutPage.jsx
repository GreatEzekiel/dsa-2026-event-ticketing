import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';

export default function CheckoutPage({ onSuccess, onCancel }) {
  const { bookings, activeCheckoutId, payBooking, cancelBooking } = useApp();
  const booking = bookings.find((b) => b.id === activeCheckoutId);

  const [secondsLeft, setSecondsLeft] = useState(300);
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((booking.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
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

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
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
          Hold: {mins}:{secs}
        </div>
      </div>

      {secondsLeft === 0 && (
        <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          This ticket hold has expired. Release it to return the seats, then reserve tickets again.
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

        <div className="flex gap-3 pt-2">
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
            className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
          >
            Release Hold
          </button>
          <button
            type="submit"
            disabled={secondsLeft === 0}
            className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition"
          >
            Pay {formatCurrency(booking.totalCents)}
          </button>
        </div>
      </form>
    </section>
  );
}
