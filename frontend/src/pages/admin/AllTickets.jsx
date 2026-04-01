import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, updateDoc, doc, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';
import { Ticket, User, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_STYLES = {
    OPEN: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_STYLES = {
    LOW: 'bg-slate-50 text-slate-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
};

export default function AllTickets() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'tickets'), snap => {
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        // Fetch all technicians for assignment
        getDocs(query(collection(db, 'users'), where('role', '==', 'TECHNICIAN'))).then(snap => {
            setTechnicians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const assignTechnician = async (ticketId, technicianId) => {
        await updateDoc(doc(db, 'tickets', ticketId), { technicianId, status: 'IN_PROGRESS' });
        const token = await currentUser.getIdToken();
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            fetch(`${API_BASE_URL}/api/tickets/${ticketId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ technicianId, reporterId: ticket.reporterId })
            }).catch(e => console.error("Sync error:", e));
        }
    };

    const updatePriority = async (ticketId, priority) => {
        await updateDoc(doc(db, 'tickets', ticketId), { priority });
    };

    const rejectTicket = async (ticketId) => {
        await updateDoc(doc(db, 'tickets', ticketId), { status: 'REJECTED' });
    };

    const seedDemoTickets = async () => {
        const demos = [
            { title: "Broken Projector - NAB 501", description: "The projector lens is damaged and showing blurred images during lectures.", priority: "HIGH", resourceId: "NAB501", reporterName: "Dilmi Perera", reporterEmail: "dilmi@example.com", status: "OPEN", createdAt: serverTimestamp(), slaDeadline: new Date(Date.now() + 24 * 3600000) },
            { title: "AC Leaking - Main Hall", description: "Water is dripping from the vent near the stage. Potential electrical hazard.", priority: "URGENT", resourceId: "MAIN_HALL", reporterName: "Kasun Silva", reporterEmail: "kasun@example.com", status: "IN_PROGRESS", createdAt: serverTimestamp(), slaDeadline: new Date(Date.now() + 4 * 3600000) },
            { title: "Wi-Fi Dead Zone - Library", description: "The back corner of the quiet study area has zero signal.", priority: "MEDIUM", resourceId: "LIBRARY", reporterName: "Amara Jay", reporterEmail: "amara@example.com", status: "OPEN", createdAt: serverTimestamp(), slaDeadline: new Date(Date.now() + 72 * 3600000) }
        ];
        for (const t of demos) {
            await addDoc(collection(db, 'tickets'), t);
        }
    };

    const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">Support Requests</h1>
                    <p className="text-sm md:text-lg text-slate-500 mt-2 font-medium">Manage campus facility tickets.</p>
                </div>
                {tickets.length === 0 && (
                    <button onClick={seedDemoTickets} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition shadow-xl shadow-slate-200">
                        ⚡ Seed Demo Data
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn('px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all',
                            filter === s ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
                        {s} ({s === 'ALL' ? tickets.length : tickets.filter(t => t.status === s).length})
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">No Tickets Found</h3>
                        <p className="text-slate-400 mt-1 font-medium max-w-xs mx-auto">Either the system is fully healthy, or no one has reported any issues yet.</p>
                    </div>
                ) : (
                    filtered.map((t, i) => {
                        const slaDate = t.slaDeadline?.seconds ? new Date(t.slaDeadline.seconds * 1000) : (t.slaDeadline ? new Date(t.slaDeadline) : null);
                        const isOverdue = slaDate && slaDate < new Date() && !['RESOLVED','CLOSED'].includes(t.status);
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className={cn("bg-white rounded-[2.5rem] border shadow-sm overflow-hidden transition-all", 
                                    isOverdue ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200 hover:border-brand-200',
                                    expandedId === t.id && 'border-brand-500 ring-4 ring-brand-500/5'
                                )}>
                                <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <Ticket className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0 sm:pr-8 w-full">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="font-bold text-slate-800 text-base md:text-lg tracking-tight truncate">{t.title}</p>
                                            {isOverdue && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Late</span>}
                                        </div>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium line-clamp-2 md:truncate">{t.description}</p>
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                <Clock className="w-3.5 h-3.5" /> SLA: {slaDate ? slaDate.toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                <User className="w-3.5 h-3.5" /> Reporter: {t.reporterName?.split(' ')[0] || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                        <span className={cn('text-[9px] md:text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest leading-none', STATUS_STYLES[t.status] || STATUS_STYLES.OPEN)}>
                                            {t.status?.replace('_', ' ')}
                                        </span>
                                        <span className={cn('text-[8px] md:text-[9px] font-black px-2 py-1 rounded-lg uppercase leading-none', PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.MEDIUM)}>
                                            {t.priority}
                                        </span>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedId === t.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50 pt-6">
                                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-6">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Case Explanation</p>
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{t.description}</p>
                                            </div>

                                            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-slate-200">
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Maintenance</p>
                                                    <select value={t.technicianId || ''} onChange={e => assignTechnician(t.id, e.target.value)}
                                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all">
                                                        <option value="">Choose technician...</option>
                                                        {technicians.map(tech => (
                                                            <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Case Urgency</p>
                                                    <select value={t.priority || 'MEDIUM'} onChange={e => updatePriority(t.id, e.target.value)}
                                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all">
                                                        <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                                                    </select>
                                                </div>
                                                {!['REJECTED','CLOSED','RESOLVED'].includes(t.status) && (
                                                    <button onClick={(e) => { e.stopPropagation(); rejectTicket(t.id); }}
                                                        className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-all ml-auto mt-auto">
                                                        Reject Ticket
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

