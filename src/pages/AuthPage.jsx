import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage({ onDone }) {
  const { login, signup, user } = useApp();
  const [mode, setMode] = useState(user ? 'login' : 'signup');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const account = mode === 'signup'
        ? await signup(email.trim(), password, role)
        : await login(email.trim(), password);
      onDone(account.role === 'organizer' ? 'organizer' : account.role === 'staff' ? 'checkin' : 'home');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-[#102a25] p-10 text-white md:flex">
        <div>
          <p className="text-sm font-bold tracking-tight">EventPulse<span className="font-normal text-emerald-300">.ng</span></p>
          <h1 className="mt-16 text-4xl font-semibold leading-tight tracking-tight">Make room for a good time.</h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">Create your own account to discover events, keep your bookings, and come back to pay later.</p>
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
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Create account
          </button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === 'signup' ? 'Use your own email and password to keep your bookings private.' : 'Sign in to see your registered events and continue checkout.'}
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
            <input
              id="auth-email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              maxLength={128}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-role" className="mb-1.5 block text-sm font-semibold text-slate-700">Account type</label>
              <select
                id="auth-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="attendee">Attendee (Browse and book events)</option>
                <option value="organizer">Organizer (Create and publish events)</option>
                <option value="staff">Staff (Check in ticket holders)</option>
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">Organizer and staff accounts are demo roles for this capstone project.</p>
            </div>
          )}

          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">Your password is stored as a one-way hash. This browser keeps your signed session for seven days.</p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account and continue' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
