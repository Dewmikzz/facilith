import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { currentUser, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-10 rounded-3xl max-w-lg w-full text-center"
            >
                <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">
                    {currentUser?.displayName?.charAt(0) || 'U'}
                </div>
                <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">
                    Welcome to Facilith, {currentUser?.displayName || 'User'}!
                </h1>
                <p className="text-slate-500 mb-8">
                    Your premium Smart Campus Hub is ready.
                </p>
                <div className="bg-white/50 rounded-xl p-4 text-left border border-slate-200 mb-8">
                    <p className="text-sm text-slate-500 font-medium">Logged in via Firebase:</p>
                    <p className="text-slate-800 font-semibold truncate">{currentUser?.email}</p>
                    <p className="text-sm text-slate-500 font-medium mt-2">Firebase UID:</p>
                    <p className="text-slate-800 font-mono text-xs truncate bg-slate-100 p-1 rounded mt-1">
                        {currentUser?.uid}
                    </p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center justify-center w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </button>
            </motion.div>
        </div>
    );
}
