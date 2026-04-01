import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Bell, X, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const TYPE_STYLES = {
    SUCCESS: 'bg-emerald-50 border-l-4 border-emerald-400',
    ALERT: 'bg-red-50 border-l-4 border-red-400',
    INFO: 'bg-blue-50 border-l-4 border-blue-400',
    WARNING: 'bg-amber-50 border-l-4 border-amber-400',
};

export default function NotificationDrawer({ open, onClose }) {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid)
        );
        const unsub = onSnapshot(q, snap => {
            const sorted = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setNotifications(sorted);
        });
        return unsub;
    }, [currentUser]);

    const clearNotification = async (id) => {
        await deleteDoc(doc(db, 'notifications', id)).catch(err => console.error(err));
    };

    const clearAll = async () => {
        for (const n of notifications) {
            await deleteDoc(doc(db, 'notifications', n.id)).catch(err => console.error(err));
        }
    };

    const count = notifications.length;

    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-slate-700" />
                                    <h2 className="font-display font-bold text-slate-900">Notifications</h2>
                                    {count > 0 && (
                                        <span className="text-xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">{count}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {count > 0 && (
                                        <button onClick={clearAll} className="text-xs font-semibold text-brand-600 hover:text-red-600 transition-colors flex items-center gap-1">
                                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                                        </button>
                                    )}
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 && (
                                    <div className="text-center py-16 text-slate-400">
                                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium text-slate-600">All caught up!</p>
                                        <p className="text-sm">You have no new notifications.</p>
                                    </div>
                                )}
                                {notifications.map((n, i) => (
                                    <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        className="relative group">
                                        <div className={cn('rounded-xl p-4 pr-10 shadow-sm transition-all', TYPE_STYLES[n.type] || TYPE_STYLES.INFO)}>
                                            <p className="text-sm font-medium text-slate-800">{n.message}</p>
                                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                                                {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                <span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                                            </p>
                                        </div>
                                        <button onClick={() => clearNotification(n.id)} 
                                            className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Export the unread count hook for the Header bell badge
export function useUnreadCount(userId) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!userId) return;
        // Since we delete them now instead of marking read, we just query all notifications for the user
        const q = query(collection(db, 'notifications'), where('userId', '==', userId));
        return onSnapshot(q, snap => setCount(snap.size));
    }, [userId]);
    return count;
}
