import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';
import { Ticket, MessageCircle, ChevronDown, ChevronUp, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
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

function TechTicketCard({ ticket }) {
    const { currentUser } = useAuth();
    const [expanded, setExpanded] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

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
            ticketId: ticket.id, 
            userId: currentUser.uid,
            userFullName: currentUser.displayName || currentUser.email || 'Technician',
            comment: newComment, 
            createdAt: serverTimestamp()
        });
        setNewComment('');
    };

    const advanceStatus = async () => {
        const currentIdx = STATUS_FLOW.indexOf(ticket.status);
        if (currentIdx < STATUS_FLOW.length - 1) {
            const nextStatus = STATUS_FLOW[currentIdx + 1];
            setUpdatingStatus(true);
            
            try {
                // Update Firestore
                await updateDoc(doc(db, 'tickets', ticket.id), { 
                    status: nextStatus
                });
                
                // Sync with backend API
                const token = await currentUser.getIdToken();
                fetch(`${API_BASE_URL}/api/tickets/${ticket.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: nextStatus, reporterId: ticket.reporterId })
                }).catch(err => console.error("Backend sync error:", err));

            } catch (err) {
                console.error("Error advancing status:", err);
                alert("Failed to update status: " + err.message);
            } finally {
                setUpdatingStatus(false);
            }
        }
    };

    const nextStatusText = STATUS_FLOW.indexOf(ticket.status) < STATUS_FLOW.length - 1 
        ? STATUS_FLOW[STATUS_FLOW.indexOf(ticket.status) + 1] 
        : null;

    return (
        <div className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors", expanded ? "border-brand-200 ring-1 ring-brand-100" : "border-slate-200 hover:border-slate-300")}>
            <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                    <Ticket className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{ticket.title}</p>
                        <span className={cn('text-xs font-bold uppercase', PRIORITY_STYLES[ticket.priority])}>{ticket.priority}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 truncate">{ticket.description}</p>
                    {ticket.slaDeadline && (
                         <p className="text-xs mt-2 text-slate-400 font-medium">
                            SLA Deadline: {new Date(ticket.slaDeadline?.seconds * 1000 || ticket.slaDeadline).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className={cn('text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide', STATUS_STYLES[ticket.status])}>
                        {ticket.status?.replace('_', ' ')}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </div>

            {expanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-slate-100 bg-slate-50/50">
                    <div className="p-5 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Original Issue Description</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                        </div>
                        
                        <div className="pt-2">
                             {nextStatusText && (
                                <button 
                                    onClick={advanceStatus} 
                                    disabled={updatingStatus}
                                    className={cn(
                                        "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                                        nextStatusText === 'RESOLVED' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20"
                                    )}
                                >
                                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {updatingStatus ? 'Updating Status...' : `Mark as ${nextStatusText.replace('_', ' ')}`}
                                </button>
                             )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                                <MessageCircle className="w-3.5 h-3.5" /> Comments & Status Updates ({comments.length})
                            </p>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto px-1">
                                {comments.map(c => (
                                    <div key={c.id} className={cn("rounded-xl border p-3 shadow-sm", c.userId === currentUser.uid ? "bg-brand-50 border-brand-100 ml-8" : "bg-white border-slate-200 mr-8")}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[10px] font-bold text-slate-800 uppercase">{c.userFullName}</p>
                                            <p className="text-[9px] font-medium text-slate-400">{c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</p>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{c.comment}</p>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendComment} className="flex gap-2 pt-2">
                                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none bg-white transition-all"
                                    placeholder="Add an update for the student or staff..." />
                                <button type="submit" disabled={!newComment.trim()} className="px-4 py-2 bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-bold hover:bg-black transition flex items-center gap-1.5 shadow-xl shadow-slate-200">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function AssignedTickets() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'tickets'), where('technicianId', '==', currentUser.uid));
        const unsub = onSnapshot(q, snap => {
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, [currentUser]);

    const activeTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
    const pastTickets = tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED');
    const filteredTickets = filter === 'ALL' ? tickets : filter === 'ACTIVE' ? activeTickets : pastTickets;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Active Assignments</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">Manage and fulfill campus maintenance tasks.</p>
            </div>

            <div className="flex gap-2">
                 {['ALL', 'ACTIVE', 'COMPLETED'].map(f => (
                     <button key={f} onClick={() => setFilter(f)}
                         className={cn('px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border',
                             filter === f ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>
                         {f} ({f === 'ALL' ? tickets.length : f === 'ACTIVE' ? activeTickets.length : pastTickets.length})
                     </button>
                 ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredTickets.length === 0 && (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <Ticket className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-xl text-slate-500 tracking-tight">No Tickets Found</p>
                        <p className="text-sm mt-1 font-medium">You have no tasks assigned in this category.</p>
                    </div>
                )}
                {filteredTickets.map(t => <TechTicketCard key={t.id} ticket={t} />)}
            </div>
        </div>
    );
}

