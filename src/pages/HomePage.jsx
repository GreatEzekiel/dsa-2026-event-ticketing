import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';

export default function HomePage({ onSelectEvent }) {
  const { events } = useApp();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('ALL');
  const [maxPriceNaira, setMaxPriceNaira] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const cities = useMemo(() => {
    const unique = new Set(events.filter((e) => e.published).map((e) => e.city));
    return ['ALL', ...Array.from(unique)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const published = events.filter((e) => e.published);

    const filtered = published.filter((ev) => {
      // Search title or venue
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          ev.title.toLowerCase().includes(q) || ev.venue.toLowerCase().includes(q);
        if (!match) return false;
      }

      // City filter
      if (city !== 'ALL' && ev.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      // Max price filter (cheapest tier in cents)
      if (maxPriceNaira !== '' && !Number.isNaN(Number(maxPriceNaira))) {
        const maxCents = Number(maxPriceNaira) * 100;
        if (ev.tiers.length === 0) return false;
        const cheapest = Math.min(...ev.tiers.map((t) => t.priceCents));
        if (cheapest > maxCents) return false;
      }

      return true;
    });

    // Stable sort copy
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.startsAt) - new Date(b.startsAt) || a.title.localeCompare(b.title);
      }
      if (sortBy === 'price') {
        const aPrice = a.tiers.length ? Math.min(...a.tiers.map((t) => t.priceCents)) : Infinity;
        const bPrice = b.tiers.length ? Math.min(...b.tiers.map((t) => t.priceCents)) : Infinity;
        return aPrice - bPrice || a.title.localeCompare(b.title);
      }
      if (sortBy === 'availability') {
        const aAvail = a.tiers.reduce((s, t) => s + (t.capacity - t.sold), 0);
        const bAvail = b.tiers.reduce((s, t) => s + (t.capacity - t.sold), 0);
        return bAvail - aAvail || a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [events, query, city, maxPriceNaira, sortBy]);

  return (
    <section className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Discover Upcoming Events</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search-q" className="block text-xs font-semibold text-slate-600 mb-1">
              Search Event or Venue
            </label>
            <input
              id="search-q"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Jazz, Landmark..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-city" className="block text-xs font-semibold text-slate-600 mb-1">
              City
            </label>
            <select
              id="filter-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Cities' : c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-price" className="block text-xs font-semibold text-slate-600 mb-1">
              Max Price (₦)
            </label>
            <input
              id="filter-price"
              type="number"
              min="0"
              value={maxPriceNaira}
              onChange={(e) => setMaxPriceNaira(e.target.value)}
              placeholder="Any price"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="sort-by" className="block text-xs font-semibold text-slate-600 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="date">Earliest Date</option>
              <option value="price">Lowest Price</option>
              <option value="availability">Most Seats Left</option>
            </select>
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No published events match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
          ))}
        </div>
      )}
    </section>
  );
}