import React from 'react';

const highlights = [
  { icon: '✦', title: 'Find your people', detail: 'Music, culture, ideas and more' },
  { icon: '⌁', title: 'Book in a few taps', detail: 'Choose your ticket and you’re in' },
  { icon: '◷', title: 'Keep every ticket close', detail: 'Your plans, all in one place' },
];

export default function WelcomePage({ onGetStarted, onSignIn }) {
  return (
    <div className="relative isolate overflow-hidden bg-[#f7f8f5] text-slate-950">
      <div className="pointer-events-none absolute -right-40 -top-52 -z-10 h-[34rem] w-[34rem] rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-lime-100/60 blur-3xl" />

      <div className="mx-auto grid min-h-[calc(100vh-128px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-12">
        <section className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-emerald-900 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            MADE FOR YOUR NEXT GREAT NIGHT
          </div>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Good plans start
            <span className="block text-emerald-700">with a ticket.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            Find the moments worth showing up for. Discover events around Nigeria, book your spot, and make memories that last longer than the night.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Explore events
              <span aria-hidden="true" className="text-xl transition group-hover:translate-x-1">→</span>
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-xl px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-white hover:text-emerald-800"
            >
              I already have an account
            </button>
          </div>

          <div className="mt-12 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-lg text-emerald-800">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Featured event preview" className="relative mx-auto w-full max-w-xl py-8 lg:py-0">
          <div className="absolute left-0 top-0 h-24 w-24 rounded-full border border-emerald-200/80" />
          <div className="absolute bottom-0 right-2 h-40 w-40 rounded-full bg-lime-200/60 blur-2xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/60 p-3 shadow-[0_30px_90px_-35px_rgba(15,60,44,0.35)] backdrop-blur">
            <div className="relative min-h-[430px] overflow-hidden rounded-[1.5rem] bg-[#102a25] p-7 text-white sm:min-h-[490px] sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(52,211,153,0.35),transparent_44%),radial-gradient(ellipse_at_18%_90%,rgba(163,230,53,0.18),transparent_45%)]" />
              <div className="absolute -right-16 top-28 h-64 w-64 rounded-full border border-emerald-300/20" />
              <div className="absolute -right-5 top-40 h-44 w-44 rounded-full border border-emerald-300/20" />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight">EventPulse<span className="font-normal text-emerald-300">.ng</span></span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Featured</span>
              </div>

              <div className="relative mt-16 sm:mt-20">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Lagos · Live music</p>
                <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-5xl">Find your rhythm.</h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">From the first note to the last encore, your next favorite night is waiting.</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400 text-xl text-emerald-950">♫</div>
                  <div>
                    <p className="text-sm font-semibold">Lagos Waterfront Jazz</p>
                    <p className="mt-1 text-xs text-slate-400">Live moments. One easy booking.</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Your next story</p>
                    <p className="mt-1 text-sm font-semibold">Starts with one click</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-emerald-900">↗</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
