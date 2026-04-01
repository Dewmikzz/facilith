import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Plus, MapPin, Users2, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_STYLES = {
    PENDING: 'bg-amber-100/90 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100/90 text-emerald-700 border-emerald-200 shadow-emerald-500/20',
    REJECTED: 'bg-red-100/90 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-100/90 text-slate-600 border-slate-200',
};

const getResourceImage = (type) => {
    switch(type) {
        case 'LAB': return 'https://images.unsplash.com/photo-1571260899304-42507011ec7a?auto=format&fit=crop&q=80&w=800'; 
        case 'EQUIPMENT': return 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800'; 
        case 'ROOM': default: return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'; 
    }
};

export default function MyBookings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [resources, setResources] = useState([]);
    const [filter, setFilter] = useState('ACTIVE');

    useEffect(() => {
        getDocs(collection(db, 'resources')).then(snap => {
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
        return onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a,b) => {
                const parseTime = (val) => {
                    if (!val) return 0;
                    if (val.seconds) return val.seconds * 1000;
                    return new Date(val).getTime() || 0;
                };
                return parseTime(b.startTime) - parseTime(a.startTime);
            });
            setBookings(data);
        });
    }, [currentUser]);

    const cancelBooking = async (bookingId) => {
        if (window.confirm("Are you sure you want to cancel this booking?")) {
             await updateDoc(doc(db, 'bookings', bookingId), { status: 'CANCELLED' });
        }
    };

    const parseToDate = (val) => {
        if (!val) return new Date(0);
        if (val.seconds) return new Date(val.seconds * 1000);
        return new Date(val);
    };

    const fmtDateShort = (ts) => {
        const d = parseToDate(ts);
        if (d.getTime() === 0) return '—';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const now = new Date();
    const filteredBookings = bookings.filter(b => {
        const endTime = b.endTime?.seconds ? new Date(b.endTime.seconds * 1000) : new Date(b.endTime);
        const isPast = endTime < now;
        
        if (filter === 'ACTIVE') return (b.status === 'PENDING' || b.status === 'APPROVED') && !isPast;
        if (filter === 'COMPLETED') return b.status === 'APPROVED' && isPast;
        if (filter === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'REJECTED';
        return true;
    });

    const activeCount = bookings.filter(b => {
        const endTime = parseToDate(b.endTime);
        return (b.status === 'PENDING' || b.status === 'APPROVED') && endTime >= now;
    }).length;

    const completedCount = bookings.filter(b => {
        const endTime = parseToDate(b.endTime);
        return b.status === 'APPROVED' && endTime < now;
    }).length;

    const cancelledCount = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your room and resource reservations.</p>
                </div>
                <button onClick={() => navigate('/user/book')}
                    className="flex items-center justify-center px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 hover:scale-105 transition-all shadow-xl shadow-brand-500/30">
                    <Plus className="w-5 h-5 mr-2" /> Book Resource
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'ACTIVE', label: 'Active & Upcoming', count: activeCount },
                    { id: 'COMPLETED', label: 'Completed', count: completedCount },
                    { id: 'CANCELLED', label: 'Cancelled / Rejected', count: cancelledCount },
                ].map(cat => (
                    <button key={cat.id} onClick={() => setFilter(cat.id)}
                        className={cn('px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm border whitespace-nowrap',
                            filter === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300')}>
                        {cat.label} <span className={cn("ml-2 px-2 py-0.5 rounded-lg", filter === cat.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                            {cat.count}
                        </span>
                    </button>
                ))}
            </div>

            {filteredBookings.length === 0 && (
                <div className="text-center py-24 text-slate-400 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold text-xl text-slate-600">No {filter.toLowerCase()} bookings</p>
                    {filter === 'ACTIVE' && <p className="mt-2 text-slate-500">Click "Book Resource" to reserve a room or equipment.</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBookings.map((b, i) => {
                    const resourceInfo = resources.find(r => r.name === b.resourceId) || { type: 'ROOM', location: 'Campus' };
                    const imageUrl = getResourceImage(resourceInfo.type);

                    return (
                        <motion.div key={b.id} 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 transition-all flex flex-col group">
                            
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                <img src={imageUrl} alt={b.resourceId} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-80" />
                                
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

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4">
                                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose</p>
                                     <p className="text-slate-700 font-medium leading-snug">{b.purpose}</p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-4">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Clock className="w-4 h-4 mr-3 text-slate-400" />
                                        <div className="font-medium text-xs leading-tight">
                                            <div>{fmtDateShort(b.startTime)}</div>
                                            <div className="text-slate-400 mt-0.5">to {fmtDateShort(b.endTime)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Users2 className="w-4 h-4 mr-3 text-slate-400" />
                                        <span className="font-medium text-xs">{b.attendeeCount} Attendees Expected</span>
                                    </div>
                                </div>

                                {b.rejectionReason && (
                                    <div className="mt-auto mb-4 bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl border border-red-100">
                                        <span className="font-bold">Rejection Reason:</span><br/>{b.rejectionReason}
                                    </div>
                                )}

                                <div className="mt-auto pt-2">
                                    {(b.status === 'PENDING' || (b.status === 'APPROVED' && filter === 'ACTIVE')) ? (
                                        <button onClick={() => cancelBooking(b.id)}
                                            className="w-full py-2.5 text-sm font-bold text-slate-500 bg-slate-100/80 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent rounded-xl transition-all">
                                            Cancel Booking
                                        </button>
                                    ) : (
                                        <button disabled className="w-full py-2.5 text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl cursor-not-allowed uppercase tracking-wide">
                                            {b.status === 'CANCELLED' ? 'Cancelled' : b.status === 'REJECTED' ? 'Rejected' : 'Completed'}
                                        </button>
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
