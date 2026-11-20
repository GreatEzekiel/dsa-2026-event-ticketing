import React from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function EventCard({ event, onSelect }) {
  const totalSeatsLeft = event.tiers.reduce(
    (sum, t) => sum + Math.max(0, t.capacity - t.sold),
    0
  );
  const cheapestCents =
    event.tiers.length > 0 ? Math.min(...event.tiers.map((t) => t.priceCents)) : null;

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            {event.city}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              totalSeatsLeft === 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {totalSeatsLeft === 0 ? 'Sold Out' : `${totalSeatsLeft} seats left`}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">{event.title}</h3>
        <p className="text-sm text-slate-600 mb-1">{event.venue}</p>
        <p className="text-xs text-slate-500">{formatDate(event.startsAt)}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Starting from</span>
          <span className="text-base font-bold text-slate-900">
            {cheapestCents !== null ? formatCurrency(cheapestCents) : 'TBA'}
          </span>
        </div>
        <button
          onClick={() => onSelect(event.id)}
          className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
        >
          View Tickets
        </button>
      </div>
    </article>
  );
}