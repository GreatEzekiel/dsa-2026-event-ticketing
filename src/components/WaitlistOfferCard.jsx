import React, { useState, useEffect } from 'react';

export default function WaitlistOfferCard({ offer, onAccept }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    offer.offerExpiresAt ? Math.max(0, Math.floor((offer.offerExpiresAt - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (offer.status !== 'offered' || !offer.offerExpiresAt) return;
    const tick = () => {
      const rem = Math.max(0, Math.floor((offer.offerExpiresAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offer.status, offer.offerExpiresAt]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="bg-white p-4 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold text-slate-900">{offer.eventTitle}</p>
        <p className="text-xs text-slate-600">
          Tier: {offer.tierName} • Status:{' '}
          <span className="uppercase font-bold text-amber-700">{offer.status}</span>
          {offer.status === 'offered' && (
            <span className="ml-2 font-mono font-bold text-rose-700">
              Expires in {mins}:{secs}
            </span>
          )}
        </p>
      </div>

      {offer.status === 'offered' && (
        <button
          onClick={() => onAccept(offer.id)}
          disabled={secondsLeft === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition"
        >
          Accept Freed Seat
        </button>
      )}
    </div>
  );
}