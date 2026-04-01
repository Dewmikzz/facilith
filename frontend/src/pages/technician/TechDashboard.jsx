import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const PRIORITY_STYLES = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700'
};

const STATUS_STYLES = {
    OPEN: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

export default function TechDashboard() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'tickets'), where('technicianId', '==', currentUser.uid));
        const unsub = onSnapshot(q, snap => {
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => {
                 const aPriority = PRIORITY_STYLES[a.priority] === PRIORITY_STYLES.URGENT ? 4 : PRIORITY_STYLES[a.priority] === PRIORITY_STYLES.HIGH ? 3 : 2;
                 const bPriority = PRIORITY_STYLES[b.priority] === PRIORITY_STYLES.URGENT ? 4 : PRIORITY_STYLES[b.priority] === PRIORITY_STYLES.HIGH ? 3 : 2;
                 return bPriority - aPriority;
            }));
        });
        return unsub;
    }, [currentUser]);

    const open = tickets.filter(t => t.status === 'OPEN').length;
    const inProg = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const done = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    const recentActive = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').slice(0, 5);

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Technician Overview</h1>
                    <p className="text-slate-500 mt-1">A high-level summary of your active assignments.</p>
                </div>
                <Link to="/tech/tickets" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 text-sm">
                    View Assigned Tickets <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Dashboard Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: 'Pending Assignment (Open)', value: open, color: 'from-slate-500 to-slate-600' },
                    { label: 'Currently working (In Progress)', value: inProg, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Completed Jobs', value: done, color: 'from-emerald-500 to-teal-600' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-5xl font-display font-bold text-slate-800">{s.value}</p>
                            <p className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">{s.label}</p>
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${s.color}`}></div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-r ${s.color} opacity-5 group-hover:scale-150 transition-transform duration-500`}></div>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-end justify-between">
                    <h2 className="text-lg font-display font-semibold text-slate-800">Priority Active Tickets</h2>
                    <Link to="/tech/tickets" className="text-sm font-semibold text-brand-600 hover:text-brand-700">See all active &rarr;</Link>
                </div>
                
                {recentActive.length === 0 && (
                    <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-semibold text-slate-500">All caught up!</p>
                        <p className="text-sm">You have no active high-priority tickets.</p>
                    </div>
                )}
                
                {recentActive.map((t, i) => {
                    const slaDate = t.slaDeadline?.seconds ? new Date(t.slaDeadline.seconds * 1000) : (t.slaDeadline ? new Date(t.slaDeadline) : null);
                    const isOverdue = slaDate && slaDate < new Date();
                    
                    return (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className={cn("bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 hover:border-brand-200 transition-colors cursor-pointer", isOverdue ? 'border-red-200' : 'border-slate-200')}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                    <p className="font-semibold text-slate-800 text-lg">{t.title}</p>
                                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', PRIORITY_STYLES[t.priority])}>{t.priority}</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate">{t.description}</p>
                                {slaDate && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        SLA: {slaDate.toLocaleDateString()} {isOverdue && <span className="text-red-500 font-bold tracking-wide uppercase">(OVERDUE)</span>}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider', STATUS_STYLES[t.status] || STATUS_STYLES.OPEN)}>
                                    {t.status?.replace('_', ' ')}
                                </span>
                                <Link to="/tech/tickets" className="text-xs font-semibold text-slate-400 hover:text-brand-600 transition">
                                    Reply / Update &rarr;
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
