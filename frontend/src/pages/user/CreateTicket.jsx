import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';

export default function CreateTicket() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', resourceId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getDocs(collection(db, 'resources')).then(snap => {
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        try {
            const ticketData = {
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                resourceId: form.resourceId,
                reporterId: currentUser.uid,
                reporterEmail: currentUser.email,
                reporterName: userData?.fullName || currentUser.displayName || 'Campus User',
                status: 'OPEN',
                createdAt: serverTimestamp(),
                // SLA Calculation based on priority (URGENT: 4h, HIGH: 24h, MEDIUM: 72h, LOW: 168h)
                slaDeadline: new Date(Date.now() + (
                    form.priority === 'URGENT' ? 4 : 
                    form.priority === 'HIGH' ? 24 : 
                    form.priority === 'LOW' ? 168 : 72
                ) * 3600000)
            };

            await addDoc(collection(db, 'tickets'), ticketData);
            setDone(true);
            setTimeout(() => navigate('/user/tickets'), 1500);
        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.message || "Failed to lodge complaint. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Complaint Lodged!</h2>
            <p className="text-slate-500 font-medium">Tracking your ticket status in your dashboard.</p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-slate-400 hover:text-brand-600 transition-all uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>
            
            <div>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Report an Issue</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">Lodge a maintenance request for campus facilities.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 p-10 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Issue Title</label>
                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                            placeholder="e.g. Broken Projector in NAB 501" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Location</label>
                            <select required value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer">
                                <option value="">Select Facility...</option>
                                {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Priority Lvl</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                                        className={cn("py-2 rounded-xl text-[9px] font-black border transition-all uppercase tracking-tighter", 
                                            form.priority === p ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                                        )}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Full Description</label>
                        <textarea required rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none resize-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                            placeholder="Detailed explanation of the issue encountered..." />
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-sm font-black text-red-700 uppercase tracking-tight">Submission Failed</h4>
                                <p className="text-xs font-semibold text-red-600/80 mt-1 leading-relaxed">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-6 border-t border-slate-100">
                    <button type="submit" disabled={submitting}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-600 transition shadow-2xl flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95">
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Lodging Complaint...</>
                        ) : (
                            <><AlertTriangle className="w-5 h-5" /> Submit Security Complaint</>
                        )}
                    </button>
                    <p className="text-center text-[10px] font-black text-slate-300 mt-6 uppercase tracking-[0.3em]">Institutional SLIIT Oversight Protocol</p>
                </div>
            </form>
        </div>
    );
}

