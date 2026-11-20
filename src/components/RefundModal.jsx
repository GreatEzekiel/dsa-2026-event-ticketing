import React from 'react';
import { calculateRefund, formatCurrency } from '../utils/helpers';

export default function RefundModal({ booking, onConfirm, onClose }) {
  if (!booking) return null;

  const isPaid = booking.status === 'paid';
  const policy = isPaid
    ? calculateRefund({ amountCents: booking.totalCents, startsAt: booking.startsAt })
    : { allowed: true, refundCents: 0, percentage: 0 };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200"
      >
        <h3 className="text-lg font-bold text-slate-900">Cancel Booking ({booking.reference})</h3>
        <p className="text-sm text-slate-600 mt-1">
          {booking.eventTitle} — {booking.quantity}x {booking.tierName}
        </p>

        {isPaid ? (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm">
            <p className="font-semibold text-amber-900">Refund Policy Breakdown</p>
            <ul className="mt-1 text-amber-800 space-y-1 text-xs">
              <li>• 7+ days before event: 100% refund</li>
              <li>• 2–6 days before event: 50% refund</li>
              <li>• Under 2 days before event: 0% refund</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-amber-200 flex justify-between font-bold text-slate-900">
              <span>Eligible Refund ({policy.percentage}%):</span>
              <span className="text-emerald-700">{formatCurrency(policy.refundCents)}</span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            This booking is unpaid. Cancelling will immediately release your held seats.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Keep Ticket
          </button>
          <button
            onClick={() => onConfirm(booking.id)}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}