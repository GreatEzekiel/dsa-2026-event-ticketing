import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function OrganizerDashboardPage() {
  const { user, events, createEvent, addTier, togglePublishEvent } = useApp();

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Lagos');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');

  const [tierForms, setTierForms] = useState({});
  const [error, setError] = useState(null);

  if (user?.role !== 'organizer') {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        FORBIDDEN: Switch to an <strong>Organizer</strong> account to manage events.
      </div>
    );
  }

  const handleCreateEvent = (e) => {
    e.preventDefault();
    setError(null);
    if (!title || !city || !venue || !startsAt) {
      setError('All event fields are required.');
      return;
    }
    createEvent({ title, city, venue, startsAt: new Date(startsAt).toISOString() });
    setTitle('');
    setVenue('');
    setStartsAt('');
  };

  const handleAddTier = (e, eventId) => {
    e.preventDefault();
    setError(null);
    const form = tierForms[eventId] || {};
    const priceCents = Math.round(Number(form.priceNaira || 0) * 100);
    const capacity = Number(form.capacity || 0);
    if (!form.name || capacity < 1) {
      setError('Tier name and capacity >= 1 are required.');
      return;
    }
    addTier(eventId, { name: form.name, priceCents, capacity });
    setTierForms((prev) => ({ ...prev, [eventId]: { name: '', priceNaira: '', capacity: '' } }));
  };

  const handleTogglePublish = (eventId) => {
    setError(null);
    try {
      togglePublishEvent(eventId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Organizer Dashboard</h1>

      {error && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Create Event Form */}
      <form
        onSubmit={handleCreateEvent}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="ev-title" className="block text-xs font-semibold text-slate-600 mb-1">
              Event Title
            </label>
            <input
              id="ev-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tech Conference"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="ev-city" className="block text-xs font-semibold text-slate-600 mb-1">
              City
            </label>
            <input
              id="ev-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="ev-venue" className="block text-xs font-semibold text-slate-600 mb-1">
              Venue
            </label>
            <input
              id="ev-venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Eko Convention Centre"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="ev-date" className="block text-xs font-semibold text-slate-600 mb-1">
              Start Date & Time
            </label>
            <input
              id="ev-date"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
        >
          Save Draft Event
        </button>
      </form>

      {/* Manage Events */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Events</h2>
        {events.map((ev) => {
          const tf = tierForms[ev.id] || { name: '', priceNaira: '', capacity: '' };
          return (
            <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      ev.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ev.published ? 'Published' : 'Draft'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{ev.title}</h3>
                  <p className="text-xs text-slate-500">
                    {ev.city} • {ev.venue} • {formatDate(ev.startsAt)}
                  </p>
                </div>

                <button
                  onClick={() => handleTogglePublish(ev.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg"
                >
                  {ev.published ? 'Unpublish' : 'Publish Event'}
                </button>
              </div>

              {/* Existing Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ev.tiers.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-emerald-700 font-semibold">{formatCurrency(t.priceCents)}</p>
                    <p className="text-slate-500">
                      Sold: {t.sold} / {t.capacity}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Tier Inline Form */}
              <form
                onSubmit={(e) => handleAddTier(e, ev.id)}
                className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100"
              >
                <div>
                  <label className="block text-xs text-slate-600">Tier Name</label>
                  <input
                    type="text"
                    placeholder="VIP"
                    value={tf.name}
                    onChange={(e) =>
                      setTierForms((p) => ({ ...p, [ev.id]: { ...tf, name: e.target.value } }))
                    }
                    className="px-2.5 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Price (₦)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={tf.priceNaira}
                    onChange={(e) =>
                      setTierForms((p) => ({ ...p, [ev.id]: { ...tf, priceNaira: e.target.value } }))
                    }
                    className="w-28 px-2.5 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Capacity</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={tf.capacity}
                    onChange={(e) =>
                      setTierForms((p) => ({ ...p, [ev.id]: { ...tf, capacity: e.target.value } }))
                    }
                    className="w-24 px-2.5 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-semibold rounded"
                >
                  + Add Tier
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}