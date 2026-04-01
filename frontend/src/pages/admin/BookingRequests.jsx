import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';
import { CalendarDays, MapPin, Users2, Clock, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_STYLES = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100/90 text-emerald-700 border-emerald-200 shadow-emerald-500/20',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

// Fallback high-quality images for different resource types
const getResourceImage = (type) => {
    switch(type) {
        case 'LAB': return 'https://images.unsplash.com/photo-1571260899304-42507011ec7a?auto=format&fit=crop&q=80&w=800'; 
        case 'EQUIPMENT': return 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800'; 
        case 'ROOM': default: return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'; 
    }
};

export default function BookingRequests() {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [resources, setResources] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        getDocs(collection(db, 'resources')).then(snap => {
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsub = onSnapshot(collection(db, 'bookings'), snap => {
            setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => {
                 const timeA = a.createdAt?.seconds || 0;
                 const timeB = b.createdAt?.seconds || 0;
                 return timeB - timeA;
            }));
        });
        return unsub;
    }, []);

    const updateStatus = async (bookingId, status, userId) => {
        await updateDoc(doc(db, 'bookings', bookingId), { status });
        const token = await currentUser.getIdToken();
        await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status, userId, rejectionReason: reason })
        }).catch(err => console.error(err));
        setRejecting(null);
        setReason('');
    };

    const filtered = bookings.filter(b => b.status === filter);

    const fmtDateShort = (ts) => {
        if (!ts) return '—';
        const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="px-4 md:px-0">
                <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">Booking Requests</h1>
                <p className="text-slate-500 mt-2 text-sm md:text-lg">Review and manage campus facility reservations.</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide border-b border-white/10 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn('px-5 py-2 rounded-xl text-sm font-bold uppercase transition-all',
                            filter === s ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300')}>
                        {s} <span className={cn("ml-2 px-2 py-0.5 rounded-md", filter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                            {bookings.filter(b => b.status === s).length}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 text-slate-400 mt-8">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold text-xl text-slate-600 text-center">No {filter.toLowerCase()} bookings</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((b, i) => {
                    const resourceInfo = resources.find(r => r.name === b.resourceId) || { type: 'ROOM', location: 'Unknown' };
                    const imageUrl = getResourceImage(resourceInfo.type);

                    return (
                        <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 transition-all flex flex-col group">
                            
                            {/* Glassmorphic Image Header */}
                            <div className="relative h-44 overflow-hidden bg-slate-100">
                                <img src={imageUrl} alt={b.resourceId} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent opacity-90" />
                                
                                <span className={cn('absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full border uppercase backdrop-blur-md shadow-lg', STATUS_STYLES[b.status] || STATUS_STYLES.PENDING)}>
                                    {b.status}
                                </span>

                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3 className="text-xl font-display font-bold leading-tight drop-shadow-md">{b.resourceId}</h3>
                                    <p className="text-sm font-medium text-white/90 flex items-center gap-1.5 mt-1 drop-shadow">
                                        <MapPin className="w-3.5 h-3.5" /> {resourceInfo.location}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col space-y-4">
                                <div>
                                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requester ID</p>
                                     <p className="text-slate-700 text-sm font-medium truncate bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{b.userId}</p>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose</p>
                                        <p className="text-slate-800 text-sm font-semibold">{b.purpose}</p>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                        <div className="font-medium text-xs leading-tight">
                                            <div>{fmtDateShort(b.startTime)}</div>
                                            <div className="text-slate-400 mt-0.5">to {fmtDateShort(b.endTime)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Users2 className="w-4 h-4 mr-2 text-slate-400" />
                                        <span className="font-medium text-xs">{b.attendeeCount} Attendees</span>
                                    </div>
                                </div>

                                {/* ADMIN ACTIONS */}
                                <div className="mt-auto pt-2">
                                    {filter === 'PENDING' && rejecting !== b.id && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateStatus(b.id, 'APPROVED', b.userId)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                <Check className="w-4 h-4"/> Approve
                                            </button>
                                            <button onClick={() => setRejecting(b.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                <X className="w-4 h-4"/> Reject
                                            </button>
                                        </div>
                                    )}

                                    {rejecting === b.id && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                            <input autoFocus value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..."
                                                className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20" />
                                            <div className="flex gap-2">
                                                <button disabled={!reason} onClick={() => updateStatus(b.id, 'REJECTED', b.userId)}
                                                    className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition shadow-md shadow-red-500/20">
                                                    Confirm
                                                </button>
                                                <button onClick={() => setRejecting(null)} 
                                                    className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {filter !== 'PENDING' && (
                                        <div className="text-center py-2.5 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                                            {b.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
