import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, MapPin, X, PlusCircle, ArrowLeft, AlertTriangle, Loader2, Clock, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const getResourceImage = (type) => {
    switch(type) {
        case 'LAB': return 'https://images.unsplash.com/photo-1571260899304-42507011ec7a?auto=format&fit=crop&q=80&w=800'; 
        case 'EQUIPMENT': return 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800'; 
        case 'ROOM': default: return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'; 
    }
};

export default function BookResource() {
    const { currentUser, role, userData } = useAuth();
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [form, setForm] = useState({ resourceId: '', startTime: '', endTime: '', purpose: '', attendeeCount: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Real-time listener for resources
        const unsub = onSnapshot(collection(db, 'resources'), (snap) => {
            const allRes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setResources(allRes);
            setLoading(false);
        }, (err) => {
            console.error("Resource Fetch Error", err);
            setError("Permission denied or database error.");
            setLoading(false);
        });

        const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('status', '==', 'APPROVED')), (snap) => {
            setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsub(); unsubBookings(); };
    }, []);

    const getResourceStatus = (resName) => {
        const now = new Date();
        const activeBooking = bookings.find(b => {
            const start = b.startTime?.seconds ? new Date(b.startTime.seconds * 1000) : (b.startTime ? new Date(b.startTime) : null);
            const end = b.endTime?.seconds ? new Date(b.endTime.seconds * 1000) : (b.endTime ? new Date(b.endTime) : null);
            return b.resourceId === resName && start && end && start <= now && end > now;
        });
        
        if (activeBooking) {
            const start = activeBooking.startTime?.seconds ? new Date(activeBooking.startTime.seconds * 1000) : new Date(activeBooking.startTime);
            const end = activeBooking.endTime?.seconds ? new Date(activeBooking.endTime.seconds * 1000) : new Date(activeBooking.endTime);
            return { 
                isBooked: true, 
                until: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                from: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                bookedBy: activeBooking.userDisplayName || 'Anonymous User',
                purpose: activeBooking.purpose || 'Campus Event',
            };
        }
        return { isBooked: false };
    };

    const categories = ['ALL', ...new Set(resources.map(r => r.category || 'General'))];
    const filteredResources = resources.filter(r => {
        if (filterCategory === 'ALL') return true;
        return (r.category || 'General') === filterCategory;
    });

    const handleBook = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        if (new Date(form.startTime) >= new Date(form.endTime)) {
            setError('End time must be after the start time.');
            setSubmitting(false);
            return;
        }

        try {
            const q = query(collection(db, 'bookings'), where('resourceId', '==', form.resourceId), where('status', '==', 'APPROVED'));
            const conflictSnap = await getDocs(q);
            const requestedStart = new Date(form.startTime).getTime();
            const requestedEnd = new Date(form.endTime).getTime();
            const hasConflict = conflictSnap.docs.some(doc => {
                const b = doc.data();
                const existingStart = b.startTime?.seconds ? b.startTime.seconds * 1000 : (b.startTime ? new Date(b.startTime).getTime() : 0);
                const existingEnd = b.endTime?.seconds ? b.endTime.seconds * 1000 : (b.endTime ? new Date(b.endTime).getTime() : 0);
                return (requestedStart < existingEnd) && (existingStart < requestedEnd);
            });

            if (hasConflict) {
                setError('Conflict: This resource is already booked for the selected time slot.');
                setSubmitting(false);
                return;
            }

            await addDoc(collection(db, 'bookings'), {
                ...form,
                startTime: new Date(form.startTime),
                endTime: new Date(form.endTime),
                userId: currentUser.uid,
                userDisplayName: userData?.fullName || currentUser.displayName || 'Campus User',
                status: 'PENDING',
                createdAt: serverTimestamp(),
            });
            navigate('/user/bookings');
        } catch (err) {
            setError("Submission failed: " + err.message);
            setSubmitting(false);
        }
    };

    const selectedResource = resources.find(r => r.name === form.resourceId);
    const selectedStatus = selectedResource ? getResourceStatus(selectedResource.name) : null;

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest">Loading Resources...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/user/bookings')} className="flex items-center text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> My History
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Request Facility
                        <span className="text-xs bg-brand-50 text-brand-600 px-3 py-1 rounded-full">{resources.length} Assets</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">SLIIT Campus (Malabe, Metro, Matara) Resource Hub.</p>
                </div>
            </div>

            {resources.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-xl">
                    <h2 className="text-2xl font-display font-bold text-slate-800">No facilities initialized.</h2>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    
                    {/* Left Column - Visual Preview */}
                    <div className="md:w-[40%] bg-slate-900 relative flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedResource?.id || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                                {selectedResource ? (
                                    <img src={getResourceImage(selectedResource.type)} className="w-full h-full object-cover opacity-60" alt="Preview" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-600 to-indigo-700 opacity-40" />
                                )}
                            </motion.div>
                        </AnimatePresence>
                        
                        <div className="relative z-10 p-8 mt-auto text-white">
                            {selectedResource ? (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{selectedResource.type}</span>
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{selectedResource.category}</span>
                                    </div>
                                    <h3 className="text-3xl font-display font-black leading-tight mb-4">{selectedResource.name}</h3>
                                    
                                    {/* Occupancy Banner */}
                                    <AnimatePresence>
                                        {selectedStatus.isBooked && (
                                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                className="mb-6 p-5 bg-amber-500/90 backdrop-blur-xl rounded-2xl border border-amber-400/30 text-white shadow-xl shadow-amber-900/20">
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-white" /> Currently Occupied
                                                </p>
                                                <div className="space-y-2">
                                                   <div className="flex items-center gap-3 text-sm font-bold truncate">
                                                        <User className="w-4 h-4 opacity-70" /> {selectedStatus.bookedBy}
                                                   </div>
                                                   <div className="flex items-center gap-3 text-sm font-bold truncate">
                                                        <MessageSquare className="w-4 h-4 opacity-70" /> {selectedStatus.purpose}
                                                   </div>
                                                   <div className="flex items-center gap-3 text-sm font-bold">
                                                        <Clock className="w-4 h-4 opacity-70" /> {selectedStatus.from} — {selectedStatus.until}
                                                   </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-3 opacity-90">
                                        <div className="flex items-center gap-3 text-sm font-bold">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                                            {selectedResource.location}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><PlusCircle className="w-4 h-4" /></div>
                                            Cap: {selectedResource.capacity} Seats
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center md:text-left py-10">
                                    <PlusCircle className="w-12 h-12 text-white/20 mb-6 mx-auto md:mx-0" />
                                    <h3 className="text-2xl font-display font-black mb-2">Facility Search</h3>
                                    <p className="text-white/60 text-sm font-medium leading-relaxed">Select specialized facilities to view current occupancy and detailed specs.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="flex-1 p-8 md:p-12 relative overflow-hidden bg-slate-50/30">
                        <form onSubmit={handleBook} className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Facility Selection</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                                    {categories.map(cat => (
                                        <button key={cat} type="button" onClick={() => setFilterCategory(cat)}
                                            className={cn("whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-bold border transition-all uppercase", 
                                                filterCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                                            )}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <select required value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all cursor-pointer shadow-sm">
                                    <option value="">Choose an asset...</option>
                                    {filteredResources.map(r => {
                                        const status = getResourceStatus(r.name);
                                        return (
                                            <option key={r.id} value={r.name} className="font-bold py-2">
                                                {r.name} {status.isBooked ? `🔴 IN USE (until ${status.until})` : `(${r.category})`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Start Window</label>
                                    <input required type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">End Window</label>
                                    <input required type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="sm:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Event Purpose</label>
                                    <input required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                                        placeholder="e.g. SLIIT Computing Final Exam Room" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Pax</label>
                                    <input required type="number" min="1" max={selectedResource?.capacity || 999} value={form.attendeeCount} onChange={e => setForm({ ...form, attendeeCount: parseInt(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-black text-red-600 flex items-center gap-3">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}

                            <div className="pt-4">
                                <button type="submit" disabled={submitting || !form.resourceId}
                                    className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-700 shadow-2xl shadow-brand-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Request Slot'}
                                </button>
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-5 uppercase tracking-[0.25em] opacity-60">Verified SLIIT Identity Protocol</p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
