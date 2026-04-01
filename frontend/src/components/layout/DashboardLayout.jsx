import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationDrawer from '../ui/NotificationDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        
                        {/* Sidebar Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col"
                        >
                            <div className="absolute top-4 right-4 z-50">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Static Sidebar (Desktop) */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <Sidebar />
            </div>

            <div className="flex flex-col flex-1 w-0 overflow-hidden h-full">
                <Header setSidebarOpen={setSidebarOpen} onNotifClick={() => setNotifOpen(true)} />
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-4 md:p-10 select-text">
                    <Outlet />
                </main>
            </div>

            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
    );
}
