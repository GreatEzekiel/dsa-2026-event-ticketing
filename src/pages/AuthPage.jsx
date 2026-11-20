import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage({ onDone }) {
  const { login, user } = useApp();
  const [email, setEmail] = useState(user?.email || 'adejare@example.com');
  const [role, setRole] = useState(user?.role || 'attendee');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    login(email, role);
    onDone(role === 'organizer' ? 'organizer' : role === 'staff' ? 'checkin' : 'home');
  };

  return (
    <section className="max-w-md mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Sign In / Switch Demo Role</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-600 mb-1">
            Email Address
          </label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label htmlFor="auth-role" className="block text-xs font-semibold text-slate-600 mb-1">
            Account Role (RBAC)
          </label>
          <select
            id="auth-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="attendee">Attendee (Browse, Book, Pay, Waitlist)</option>
            <option value="organizer">Organizer (Create & Publish Events)</option>
            <option value="staff">Staff (Scan & Validate QR Tickets)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
        >
          Continue as {role}
        </button>
      </form>
    </section>
  );
}