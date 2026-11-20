import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import MyTicketsPage from './pages/MyTicketsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import StaffCheckinPage from './pages/StaffCheckinPage';
import AuthPage from './pages/AuthPage';

function MainRouter() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-detail');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {currentPage === 'home' && <HomePage onSelectEvent={handleSelectEvent} />}

        {currentPage === 'event-detail' && (
          <EventDetailPage
            eventId={selectedEventId}
            onBack={() => setCurrentPage('home')}
            onProceedCheckout={() => setCurrentPage('checkout')}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onSuccess={() => setCurrentPage('tickets')}
            onCancel={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'tickets' && (
          <MyTicketsPage onOpenCheckout={() => setCurrentPage('checkout')} />
        )}

        {currentPage === 'organizer' && <OrganizerDashboardPage />}

        {currentPage === 'checkin' && <StaffCheckinPage />}

        {currentPage === 'auth' && <AuthPage onDone={(next) => setCurrentPage(next)} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        EventPulse Capstone • React.js + Tailwind CSS + Node.js + MySQL
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}