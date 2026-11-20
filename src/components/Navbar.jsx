import React from "react";
import { useApp } from "../context/AppContext";

export default function Navbar({ currentPage, setCurrentPage }) {
  const { user, logout, waitlist } = useApp();
  const activeOffers = waitlist.filter(
    (w) => w.userId === user?.id && w.status === "offered"
  ).length;

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentPage(user ? "home" : "welcome")}
          className="text-xl font-bold tracking-tight text-emerald-400 hover:text-emerald-300"
        >
          EventPulse<span className="text-white font-normal">.ng</span>
        </button>

        <nav className="flex items-center gap-2 sm:gap-5 text-sm font-medium">
          {user && <button
            type="button"
            onClick={() => setCurrentPage("home")}
            className={`px-3 py-1.5 rounded-md transition ${
              currentPage === "home"
                ? "bg-slate-800 text-emerald-400"
                : "hover:text-emerald-300"
            }`}
          >
            Browse Events
          </button>}

          {user && (
            <button
              type="button"
              onClick={() => setCurrentPage("tickets")}
              className={`px-3 py-1.5 rounded-md transition relative ${
                currentPage === "tickets"
                  ? "bg-slate-800 text-emerald-400"
                  : "hover:text-emerald-300"
              }`}
            >
              My Registered Events
              {activeOffers > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-full">
                  {activeOffers} Offer
                </span>
              )}
            </button>
          )}

          {user?.role === "organizer" && (
            <button
              type="button"
              onClick={() => setCurrentPage("organizer")}
              className={`px-3 py-1.5 rounded-md transition ${
                currentPage === "organizer"
                  ? "bg-slate-800 text-emerald-400"
                  : "hover:text-emerald-300"
              }`}
            >
              Organizer Studio
            </button>
          )}

          {user?.role === "staff" && (
            <button
              type="button"
              onClick={() => setCurrentPage("checkin")}
              className={`px-3 py-1.5 rounded-md transition ${
                currentPage === "checkin"
                  ? "bg-slate-800 text-emerald-400"
                  : "hover:text-emerald-300"
              }`}
            >
              Door Check-In
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden md:inline text-slate-300">
                {user.email}{" "}
                <span className="uppercase text-xs bg-slate-700 text-emerald-300 px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage("auth")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700"
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setCurrentPage("welcome");
                }}
                className="px-3 py-1.5 text-rose-400 hover:text-rose-300"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPage("auth")}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md"
            >
              Join EventPulse
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
