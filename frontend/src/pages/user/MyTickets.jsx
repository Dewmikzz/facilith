import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Ticket, MessageCircle, ChevronDown, ChevronUp, Send, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
    OPEN: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_STYLES = {
    LOW: 'text-slate-500', MEDIUM: 'text-brand-600', HIGH: 'text-orange-600', URGENT: 'text-red-600'
};

function TicketCard({ ticket, index }) {
    const { currentUser } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (!expanded) return;
        const q = query(collection(db, 'comments'), where('ticketId', '==', ticket.id));
        const unsub = onSnapshot(q, snap => {
            setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
        });
        return unsub;
    }, [expanded, ticket.id]);

    const sendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        await addDoc(collection(db, 'comments'), {
            ticketId: ticket.id, userId: currentUser.uid,
            userFullName: currentUser.displayName || currentUser.email || 'Campus User',
            comment: newComment, createdAt: serverTimestamp()
        });
        setNewComment('');
    };

    const slaDate = ticket.slaDeadline?.seconds ? new Date(ticket.slaDeadline.seconds * 1000) : (ticket.slaDeadline ? new Date(ticket.slaDeadline) : null);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className={cn("bg-white rounded-3xl border shadow-sm overflow-hidden transition-all", expanded ? "border-brand-300 ring-4 ring-brand-500/5" : "border-slate-200 hover:border-slate-300")}>
            <div className="p-6 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Ticket className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-lg tracking-tight">{ticket.title}</p>
                        <span className={cn('text-[10px] font-black uppercase tracking-widest', PRIORITY_STYLES[ticket.priority])}>{ticket.priority}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 font-medium truncate">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                           <Clock className="w-3.5 h-3.5" /> Est: {slaDate?.toLocaleDateString() || 'Pending'}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn('text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest', STATUS_STYLES[ticket.status])}>
                        {ticket.status?.replace('_', ' ')}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50/30">
                        <div className="p-6 space-y-6">
                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Case Details</p>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <MessageCircle className="w-4 h-4" /> Official log & comments ({comments.length})
                                </p>
                                <div className="space-y-3 px-1">
                                    {comments.map(c => (
                                        <div key={c.id} className={cn("rounded-2xl border p-4 shadow-sm", c.userId === currentUser.uid ? "bg-brand-50 border-brand-100 ml-8" : "bg-white border-slate-200 mr-8")}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{c.userId === currentUser.uid ? 'You' : c.userFullName}</p>
                                                <p className="text-[9px] font-medium text-slate-400">{c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</p>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{c.comment}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={sendComment} className="flex gap-2 pt-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                                        placeholder="Add more information or thank the tech..." />
                                    <button type="submit" disabled={!newComment.trim()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition flex items-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-30">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function MyTickets() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'tickets'), where('reporterId', '==', currentUser.uid));
        const unsub = onSnapshot(q, snap => {
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });
        return unsub;
    }, [currentUser]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Active Inquiries</h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium tracking-tight">Manage your maintenance requests and add comments.</p>
                </div>
                <Link to="/user/tickets/new" className="px-6 py-3.5 bg-brand-600 text-white rounded-2xl font-black text-sm hover:bg-brand-700 transition shadow-2xl shadow-brand-500/30 uppercase tracking-widest whitespace-nowrap">
                    + New Inquiry
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tickets.length === 0 && (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <Ticket className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-xl text-slate-800 tracking-tight">No Active Tickets</p>
                        <p className="text-sm mt-1 font-medium">Lodge a maintenance request to get started.</p>
                    </div>
                )}
                {tickets.map((t, i) => <TicketCard key={t.id} ticket={t} index={i} />)}
            </div>
        </div>
    );
}

