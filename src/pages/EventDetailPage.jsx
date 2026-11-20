import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function EventDetailPage({ eventId, onBack, onProceedCheckout }) {
  const { events, createBooking, joinWaitlist, waitlist, user } = useApp();
  const event = events.find((e) => e.id === eventId);

  const [quantities, setQuantities] = useState({});
  const [feedback, setFeedback] = useState(null);

  if (!event) {
    return (
      <div className="p-6 bg-white rounded-xl">
        <p>Event not found.</p>
        <button onClick={onBack} className="mt-4 text-emerald-600 underline">
          Back to events
        </button>
      </div>
    );
  }

  const handleQtyChange = (tierId, val, seatsLeft) => {
    const maxAllowed = Math.min(10, seatsLeft);
    const clamped = Math.max(1, Math.min(maxAllowed, Number(val) || 1));
    setQuantities((prev) => ({ ...prev, [tierId]: clamped }));
  };

  const handleBook = async (tierId) => {
    setFeedback(null);
    try {
      const qty = quantities[tierId] || 1;
      await createBooking({ eventId: event.id, tierId, quantity: qty });
      onProceedCheckout();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleJoinWaitlist = (tierId) => {
    setFeedback(null);
    try {
      joinWaitlist(event.id, tierId);
      setFeedback({
        type: 'success',
        text: 'Added to FIFO waitlist! You will receive a timed offer if a seat opens up.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
      >
        ← Back to all events
      </button>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          {event.city}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">{event.title}</h1>
        <p className="text-slate-600 mt-1">{event.venue}</p>
        <p className="text-sm text-slate-500 mt-1">{formatDate(event.startsAt)}</p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-lg text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Select Ticket Tier</h2>
        {event.tiers.map((tier) => {
          const seatsLeft = Math.max(0, tier.capacity - tier.sold);
          const isSoldOut = seatsLeft === 0;
          const qty = quantities[tier.id] || 1;
          const onWaitlist = waitlist.some(
            (w) =>
              w.userId === user?.id &&
              w.tierId === tier.id &&
              ['waiting', 'offered'].includes(w.status)
          );

          return (
            <div
              key={tier.id}
              className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isSoldOut
                  ? 'bg-slate-50 border-slate-200 opacity-90'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{tier.name}</h3>
                  {isSoldOut ? (
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      Sold Out
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">({seatsLeft} remaining)</span>
                  )}
                </div>
                <p className="text-lg font-extrabold text-emerald-700 mt-1">
                  {formatCurrency(tier.priceCents)}
                </p>
              </div>

              {isSoldOut ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-200 text-slate-500 text-sm font-semibold rounded-lg cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                  <button
                    onClick={() => handleJoinWaitlist(tier.id)}
                    disabled={onWaitlist}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-slate-950 text-sm font-semibold rounded-lg transition"
                  >
                    {onWaitlist ? 'On Waitlist' : 'Join Waitlist'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label htmlFor={`qty-${tier.id}`} className="text-xs font-semibold text-slate-600">
                    Qty:
                  </label>
                  <input
                    id={`qty-${tier.id}`}
                    type="number"
                    min="1"
                    max={Math.min(10, seatsLeft)}
                    value={qty}
                    onChange={(e) => handleQtyChange(tier.id, e.target.value, seatsLeft)}
                    className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center text-sm"
                  />
                  <button
                    onClick={() => handleBook(tier.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Reserve ({formatCurrency(tier.priceCents * qty)})
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
