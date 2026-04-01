import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../ui/NotificationDrawer';

export default function Header({ setSidebarOpen, onNotifClick }) {
    const { currentUser, userData, logout } = useAuth();
    const unread = useUnreadCount(currentUser?.uid);
    
    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-xl px-4 shadow-sm sm:px-6 lg:px-8">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-700 lg:hidden focus:outline-none"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Title / Search */}
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
                {/* Search removed by request */}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-x-4 lg:gap-x-6 relative">
                {/* Global Status */}
                <div className="hidden md:flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm mr-2">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System Operational
                </div>

                <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
                
                <button type="button" onClick={onNotifClick}
                    className="-m-2.5 p-2.5 text-slate-500 hover:text-slate-800 transition-colors relative">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    {unread > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                </button>
                
                <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
                
                <div className="flex items-center gap-x-4 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors group">
                    <span className="sr-only">Open user menu</span>
                    {(userData?.photoURL || currentUser?.photoURL) ? (
                        <img className="h-9 w-9 rounded-full object-cover border-2 border-slate-100 group-hover:border-brand-200 transition-colors" src={userData?.photoURL || currentUser?.photoURL} alt="" />
                    ) : (
                        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm border border-brand-200 group-hover:bg-brand-500 group-hover:text-white transition-all">
                            {userData?.fullName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="hidden lg:flex flex-col text-left">
                        <span className="text-sm font-semibold leading-none text-slate-900" aria-hidden="true">{userData?.fullName || 'Campus User'}</span>
                        <span className="text-xs font-medium text-slate-500 mt-1" aria-hidden="true">{userData?.email || currentUser?.email || 'admin@univeristy.edu'}</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 underline decoration-brand-200 underline-offset-4 ml-2"
                >
                    Logout
                </button>

            </div>
        </header>
    );
}
