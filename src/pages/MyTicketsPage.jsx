import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import RefundModal from '../components/RefundModal';
import QrCodeCanvas from '../components/QrCodeCanvas';
import WaitlistOfferCard from '../components/WaitlistOfferCard';

export default function MyTicketsPage({ onOpenCheckout }) {
  const {
    user,
    bookings,
    waitlist,
    cancelBooking,
    acceptWaitlistOffer,
    setActiveCheckoutId,
  } = useApp();

  const [cancelTarget, setCancelTarget] = useState(null);
  const [message, setMessage] = useState(null);

  const myBookings = bookings.filter((b) => b.userId === user?.id);
  const myWaitlist = waitlist.filter(
    (w) => w.userId === user?.id && ['waiting', 'offered'].includes(w.status)
  );

  const handleConfirmCancel = (bookingId) => {
    setMessage(null);
    try {
      cancelBooking(bookingId);
      setCancelTarget(null);
      setMessage({ type: 'success', text: 'Booking cancelled and seats released.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAcceptOffer = (waitlistId) => {
    setMessage(null);
    try {
      acceptWaitlistOffer(waitlistId);
      onOpenCheckout();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Tickets & Waitlist</h1>

      {message && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {myWaitlist.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-amber-950">Active Waitlist & Offers</h2>
          {myWaitlist.map((w) => (
            <WaitlistOfferCard key={w.id} offer={w} onAccept={handleAcceptOffer} />
          ))}
        </div>
      )}

      {myBookings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          You have not booked any tickets yet.
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {b.reference}
                  </span>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                      b.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'checked_in'
                        ? 'bg-indigo-100 text-indigo-800'
                        : b.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{b.eventTitle}</h3>
                <p className="text-sm text-slate-600">
                  {b.quantity} × {b.tierName} • {formatCurrency(b.totalCents)}
                </p>
                <p className="text-xs text-slate-500">Starts: {formatDate(b.startsAt)}</p>
                {b.checkedInAt && (
                  <p className="text-xs font-semibold text-indigo-700">
                    Admitted at: {b.checkedInAt}
                  </p>
                )}
                {b.status === 'refunded' && (
                  <p className="text-xs font-semibold text-emerald-700">
                    Refunded: {formatCurrency(b.refundedCents || 0)}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {b.status === 'paid' && b.qrToken && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <QrCodeCanvas value={b.qrToken} moduleSize={5} />
                    <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg max-w-[210px]">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Token Payload
                      </span>
                      <code className="text-[11px] break-all select-all">{b.qrToken}</code>
                    </div>
                  </div>
                )}

                {b.status === 'pending' && (
                  <button
                    onClick={() => {
                      setActiveCheckoutId(b.id);
                      onOpenCheckout();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
                  >
                    Pay Now
                  </button>
                )}

                {(b.status === 'pending' || b.status === 'paid') && (
                  <button
                    onClick={() => setCancelTarget(b)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold rounded-lg border border-rose-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RefundModal
        booking={cancelTarget}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </section>
  );
}