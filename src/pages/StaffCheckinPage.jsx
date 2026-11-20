import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function StaffCheckinPage() {
  const { user, events, checkinTicket } = useApp();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState(null);

  if (user?.role !== 'staff') {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        FORBIDDEN: Switch to a <strong>Staff</strong> account to access Door Check-In.
      </div>
    );
  }

  const handleScan = (e) => {
    e.preventDefault();
    try {
      const admitted = checkinTicket({ token: tokenInput, targetEventId: selectedEventId });
      setScanResult({
        ok: true,
        title: 'ADMITTED',
        detail: `Ref ${admitted.reference} (${admitted.quantity}× ${admitted.tierName}) checked in at ${admitted.checkedInAt}.`,
      });
      setTokenInput('');
    } catch (err) {
      setScanResult({
        ok: false,
        title: 'ENTRY REJECTED',
        detail: err.message,
      });
    }
  };

  return (
    <section className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Gate QR Check-In</h1>

      <form onSubmit={handleScan} className="space-y-4">
        <div>
          <label htmlFor="gate-event" className="block text-xs font-semibold text-slate-600 mb-1">
            Active Gate Event
          </label>
          <select
            id="gate-event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="qr-token" className="block text-xs font-semibold text-slate-600 mb-1">
            Paste Signed QR Token
          </label>
          <textarea
            id="qr-token"
            rows="3"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste token from attendee's My Tickets screen..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-lg transition"
        >
          Verify & Admit Ticket
        </button>
      </form>

      {scanResult && (
        <div
          role="alert"
          className={`p-4 rounded-xl border-2 ${
            scanResult.ok
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : 'bg-rose-50 border-rose-500 text-rose-900'
          }`}
        >
          <p className="text-lg font-extrabold">{scanResult.title}</p>
          <p className="text-sm mt-1">{scanResult.detail}</p>
        </div>
      )}
    </section>
  );
}