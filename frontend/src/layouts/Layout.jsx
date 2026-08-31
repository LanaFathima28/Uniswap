import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              CampusConnect Portal
            </span>
          </div>

          {/* Right Header Actions: Notification Bell */}
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page View Outlet */}
        <div className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
