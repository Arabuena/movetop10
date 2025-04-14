import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const PassengerLayout = () => {
  return (
    <div className="min-h-screen bg-move-gray-100">
      <Header />
      <main className="pb-16"> {/* Espaço para BottomNav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default PassengerLayout; 