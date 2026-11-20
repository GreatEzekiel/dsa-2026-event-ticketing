import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage({ onDone }) {
  const { login, user } = useApp();
  const [email, setEmail] = useState(user?.email || 'adejare@example.com');
  const [role, setRole] = useState(user?.role || 'attendee');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    await login(email, role);
    onDone(role === 'organizer' ? 'organizer' : role === 'staff' ? 'checkin' : 'home');
  };

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-[#102a25] p-10 text-white md:flex">
        <div>
          <p className="text-sm font-bold tracking-tight">EventPulse<span className="font-normal text-emerald-300">.ng</span></p>
          <h1 className="mt-16 text-4xl font-semibold leading-tight tracking-tight">Make room for a good time.</h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">Sign in or create your demo profile to discover events and book your next experience.</p>
        </div>
        <p className="text-xs text-emerald-200">Great events. Easy plans. All in one place.</p>
      </div>

      <div className="p-6 sm:p-10 lg:p-12">
        <button
          type="button"
          onClick={() => onDone('welcome')}
          className="mb-8 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
        >
          ← Back to welcome
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Sign in or create an account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter your email to continue to events and ticket booking.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label htmlFor="auth-role" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Continue as
          </label>
          <select
            id="auth-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="attendee">Attendee (Browse, Book, Pay, Waitlist)</option>
            <option value="organizer">Organizer (Create & Publish Events)</option>
            <option value="staff">Staff (Scan & Validate QR Tickets)</option>
          </select>
        </div>

          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">Demo access: no password is required. Continuing creates or opens a local demo profile.</p>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            Continue to EventPulse
          </button>
        </form>
      </div>
    </section>
  );
}
