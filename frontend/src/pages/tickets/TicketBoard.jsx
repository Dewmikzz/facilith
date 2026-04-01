import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Clock, UserCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const initialTickets = [
    { id: 'T-1021', title: 'Projector broken in Hall A', status: 'OPEN', priority: 'HIGH', reporter: 'alex@uni.edu', time: '2 hours ago' },
    { id: 'T-1022', title: 'AC leaking', status: 'IN_PROGRESS', priority: 'URGENT', reporter: 'staff@uni.edu', time: '5 hours ago' },
    { id: 'T-1023', title: 'New HDMI cables needed', status: 'RESOLVED', priority: 'LOW', reporter: 'prof@uni.edu', time: '1 day ago' },
];

const columns = [
    { id: 'OPEN', title: 'Open Tickets', color: 'bg-slate-100', dot: 'bg-slate-400' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-brand-50', dot: 'bg-brand-500' },
    { id: 'RESOLVED', title: 'Resolved', color: 'bg-emerald-50', dot: 'bg-emerald-500' }
];

export default function TicketBoard() {
    const [tickets, setTickets] = useState(initialTickets);

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Maintenance Tickets</h1>
                    <p className="text-slate-500 mt-1 font-medium">Drag and drop tickets to update their resolution status.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                    <Plus className="w-5 h-5 mr-2" />
                    New Ticket
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar">
                <div className="flex gap-6 h-full pb-8 min-w-max">
                    {columns.map(column => (
                        <div key={column.id} className={cn("w-80 flex flex-col rounded-2xl border border-slate-200 shadow-sm overflow-hidden", column.color)}>
                            <div className="p-4 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
                                <div className="flex items-center">
                                    <div className={cn("w-2.5 h-2.5 rounded-full mr-2", column.dot)}></div>
                                    <h3 className="font-semibold text-slate-800">{column.title}</h3>
                                    <span className="ml-3 text-xs font-semibold bg-white text-slate-500 px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                                        {tickets.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {tickets.filter(t => t.status === column.id).map((ticket, idx) => (
                                    <motion.div 
                                        layoutId={ticket.id}
                                        key={ticket.id}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 cursor-grab hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-bold text-slate-400">{ticket.id}</span>
                                            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide", getPriorityColor(ticket.priority))}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-4 group-hover:text-brand-600 transition-colors">
                                            {ticket.title}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                            <div className="flex items-center"><UserCircle2 className="w-4 h-4 mr-1 text-slate-400" /> {ticket.reporter.split('@')[0]}</div>
                                            <div className="flex items-center"><Clock className="w-4 h-4 mr-1 text-slate-400" /> {ticket.time}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
