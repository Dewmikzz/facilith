import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, Users2, MapPin, X, AlertTriangle, Loader2, Landmark, GraduationCap, User, Clock, MessageSquare, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const TYPE_COLORS = { ROOM: 'bg-indigo-50 text-indigo-700', LAB: 'bg-emerald-50 text-emerald-700', EQUIPMENT: 'bg-amber-50 text-amber-700' };
const STATUS_COLORS = { ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200', OUT_OF_SERVICE: 'bg-red-100 text-red-700 border-red-200' };
const CAT_COLORS = { 
    Computing: 'bg-sky-50 text-sky-700 border-sky-100', 
    Engineering: 'bg-orange-50 text-orange-700 border-orange-100', 
    Business: 'bg-purple-50 text-purple-700 border-purple-100', 
    Humanities: 'bg-pink-50 text-pink-700 border-pink-100', 
    Science: 'bg-teal-50 text-teal-700 border-teal-100', 
    General: 'bg-slate-50 text-slate-700 border-slate-100' 
};
const EMPTY_FORM = { name: '', type: 'ROOM', capacity: 10, location: '', category: 'General', status: 'ACTIVE' };
const CATEGORIES = ['Computing', 'Engineering', 'Business', 'Humanities', 'Science', 'General'];

export default function ResourceManager() {
    const { currentUser } = useAuth();
    const [resources, setResources] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('ALL');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'resources'), 
            (snap) => {
                setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            }
        );
        
        const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('status', '==', 'APPROVED')), 
            (snap) => {
                setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );

        return () => { unsub(); unsubBookings(); };
    }, []);

    const getCurrentStatus = (resName) => {
        const now = new Date();
        const active = bookings.find(b => {
            const start = b.startTime?.seconds ? new Date(b.startTime.seconds * 1000) : new Date(b.startTime);
            const end = b.endTime?.seconds ? new Date(b.endTime.seconds * 1000) : new Date(b.endTime);
            return b.resourceId === resName && start <= now && end > now;
        });
        
        if (active) {
            const start = active.startTime?.seconds ? new Date(active.startTime.seconds * 1000) : new Date(active.startTime);
            const end = active.endTime?.seconds ? new Date(active.endTime.seconds * 1000) : new Date(active.endTime);
            return { 
                isBooked: true, 
                until: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                from: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                user: active.userDisplayName || 'User',
                purpose: active.purpose || 'Event'
            };
        }
        return { isBooked: false };
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                await updateDoc(doc(db, 'resources', editing), form);
            } else {
                await addDoc(collection(db, 'resources'), { ...form, createdAt: serverTimestamp() });
            }
            setShowModal(false);
        } catch (err) {
            alert("Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this facility?')) {
            await deleteDoc(doc(db, 'resources', id));
        }
    };

    const clearAll = async () => {
        if (!window.confirm('WARNING: Purge ALL asset data?')) return;
        setSaving(true);
        const snap = await getDocs(collection(db, 'resources'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setSaving(false);
    };

    const initializeCampusAssets = async () => {
        if (!window.confirm('Initialize 50+ SLIIT facilities?')) return;
        setSaving(true);
        const data = [
            // Malabe Main Hall - The user's example
            { name: 'SLIIT Malabe MAIN HALL', type: 'ROOM', capacity: 1500, location: 'NAB, FLOOR 2', category: 'General', status: 'ACTIVE' },
            // ... (rest of the SLIIT data from previous version)
            { name: 'NAB 501 - AI & Data Science Lab', type: 'LAB', capacity: 40, location: 'NAB Malabe, Floor 5', category: 'Computing', status: 'ACTIVE' },
            { name: 'NAB 502 - Cybersecurity Suite', type: 'LAB', capacity: 35, location: 'NAB Malabe, Floor 5', category: 'Computing', status: 'ACTIVE' },
            { name: 'NAB 401 - Cloud Computing Hub', type: 'LAB', capacity: 50, location: 'NAB Malabe, Floor 4', category: 'Computing', status: 'ACTIVE' },
            { name: 'Engineering Block A - Workshop', type: 'LAB', capacity: 25, location: 'Malabe Campus', category: 'Engineering', status: 'ACTIVE' },
            { name: 'Metro Campus Seminar Hall', type: 'ROOM', capacity: 120, location: 'Colombo 03', category: 'Business', status: 'ACTIVE' },
            { name: 'Matara Center Lab 01', type: 'LAB', capacity: 30, location: 'Matara', category: 'General', status: 'ACTIVE' },
        ];
        
        const batch = writeBatch(db);
        data.forEach(item => {
            const newRef = doc(collection(db, 'resources'));
            batch.set(newRef, { ...item, createdAt: serverTimestamp() });
        });
        await batch.commit();
        setSaving(false);
    };

    const filtered = resources.filter(r => filterCategory === 'ALL' || r.category === filterCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900">Resource Hub</h1>
                    <p className="text-slate-500 mt-1">Operational management of SLIIT campus facilities.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={clearAll} disabled={saving || resources.length === 0} className="p-3 text-red-400 border border-slate-200 rounded-2xl hover:bg-red-50 transition shadow-sm"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center px-6 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs hover:bg-brand-700 transition shadow-xl active:scale-95"><Plus className="w-4 h-4 mr-2" /> New Asset</button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['ALL', ...CATEGORIES].map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)}
                        className={cn("px-4 py-2 rounded-xl text-[9px] font-black border transition-all uppercase", 
                            filterCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                        )}>
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-xl">
                    <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-6" />
                    <button onClick={initializeCampusAssets} disabled={saving} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-brand-600 transition-all shadow-2xl">Initialize SLIIT Campus Assets</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((r, i) => {
                        const status = getCurrentStatus(r.name);
                        return (
                            <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-6 hover:shadow-2xl hover:border-brand-100 transition-all group overflow-hidden relative">
                                
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <h3 className="font-display font-black text-slate-800 text-lg leading-tight truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">{r.name}</h3>
                                        <div className="flex gap-1.5 mt-2.5">
                                            <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-md uppercase border', TYPE_COLORS[r.type] || TYPE_COLORS.ROOM)}>{r.type}</span>
                                            <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-md border uppercase', CAT_COLORS[r.category] || CAT_COLORS.General)}>{r.category}</span>
                                        </div>
                                    </div>
                                    <span className={cn('text-[8px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest', STATUS_COLORS[r.status] || STATUS_COLORS.ACTIVE)}>
                                        {status.isBooked ? '🔴 IN USE' : r.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                {status.isBooked && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-amber-50 rounded-2xl p-4 border border-amber-100 relative overflow-hidden group/info">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                <Info className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Current Reservation
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 truncate">
                                                    <User className="w-3.5 h-3.5 text-amber-500" /> {status.user}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 truncate">
                                                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> {status.purpose}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-black text-amber-600 bg-white px-2 py-1 rounded-lg w-fit shadow-sm">
                                                    <Clock className="w-3.5 h-3.5" /> {status.from} — {status.until}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                        <Users2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-black">{r.capacity} Seats</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/50 truncate">
                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="text-[10px] font-black truncate uppercase tracking-tight">{r.location}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-100/60 mt-auto">
                                    <button onClick={() => { setEditing(r.id); setForm({ ...r }); setShowModal(true); }}
                                        className="flex-1 py-3 text-[10px] font-black text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">Edit</button>
                                    <button onClick={() => handleDelete(r.id)}
                                        className="p-3 text-red-100 border border-red-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md p-6 sm:p-10 relative overflow-hidden border border-slate-200">
                            <h2 className="text-3xl font-display font-black text-slate-900 mb-8">{editing ? 'Edit Facility' : 'New Facility'}</h2>
                            <form onSubmit={handleSave} className="space-y-5">
                                <input required type="text" value={form.name} placeholder="Official Name" onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" />
                                <div className="grid grid-cols-2 gap-5">
                                    <input required type="text" value={form.location} placeholder="Location" onChange={e => setForm({ ...form, location: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" />
                                    <input required type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer">
                                        <option>ROOM</option><option>LAB</option><option>EQUIPMENT</option>
                                    </select>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-700 transition shadow-2xl active:scale-95 disabled:opacity-50">Save Facility</button>
                                <button type="button" onClick={() => setShowModal(false)} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
