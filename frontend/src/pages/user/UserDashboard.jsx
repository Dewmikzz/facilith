import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays, Ticket, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function UserDashboard() {
    const { currentUser, userData } = useAuth();
    const [stats, setStats] = useState({ 
        bookings: 0, 
        approved: 0, 
        tickets: 0, 
        pending: 0,
        successRate: 0,
        ticketResRate: 0,
        nextBooking: null,
        weekData: [
            { name: 'Mon', count: 0 }, { name: 'Tue', count: 0 }, { name: 'Wed', count: 0 }, 
            { name: 'Thu', count: 0 }, { name: 'Fri', count: 0 }, { name: 'Sat', count: 0 }, { name: 'Sun', count: 0 }
        ]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const fetchUserStats = async () => {
            try {
                const bSnap = await getDocs(query(collection(db, 'bookings'), where('userId', '==', currentUser.uid)));
                const tSnap = await getDocs(query(collection(db, 'tickets'), where('reporterId', '==', currentUser.uid)));
                
                const bDocs = bSnap.docs.map(d => d.data());
                const tDocs = tSnap.docs.map(d => d.data());

                const totalBookings = bSnap.size;
                const approvedCount = bDocs.filter(b => b.status === 'APPROVED').length;
                const pendingCount = bDocs.filter(b => b.status === 'PENDING').length;
                const openTickets = tDocs.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
                const resolvedTickets = tDocs.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

                // Next Upcoming Booking
                const now = new Date();
                const next = bDocs
                    .filter(b => {
                        const start = b.startTime?.seconds ? new Date(b.startTime.seconds * 1000) : new Date(b.startTime);
                        return start > now && b.status === 'APPROVED';
                    })
                    .sort((a, b) => (a.startTime?.seconds || 0) - (b.startTime?.seconds || 0))[0];

                // Weekly Distribution
                const dayCounts = [0, 0, 0, 0, 0, 0, 0];
                bDocs.forEach(b => {
                    const date = b.startTime?.seconds ? new Date(b.startTime.seconds * 1000) : (b.startTime ? new Date(b.startTime) : null);
                    if (date) {
                        let day = date.getDay();
                        const apiDay = day === 0 ? 6 : day - 1;
                        dayCounts[apiDay]++;
                    }
                });

                const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
                    name, count: dayCounts[i]
                }));

                setStats({
                    bookings: totalBookings,
                    approved: approvedCount,
                    tickets: openTickets,
                    pending: pendingCount,
                    successRate: totalBookings > 0 ? Math.round((approvedCount / totalBookings) * 100) : 0,
                    ticketResRate: tDocs.length > 0 ? Math.round((resolvedTickets / tDocs.length) * 100) : 0,
                    nextBooking: next || null,
                    weekData
                });
            } catch (err) {
                console.error("User Stats Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserStats();
    }, [currentUser]);

    const cards = [
        { label: 'Total Bookings', value: stats.bookings, trend: '+12.5%', icon: CalendarDays, color: 'from-blue-500 to-indigo-600' },
        { label: 'Pending Slots', value: stats.pending, trend: 'Waiting', icon: Clock, color: 'from-amber-400 to-orange-500' },
        { label: 'Open Tickets', value: stats.tickets, trend: 'Active', icon: Ticket, color: 'from-red-400 to-rose-600' },
        { label: 'Approved Slots', value: stats.approved, trend: 'Confirmed', icon: CheckCircle, color: 'from-emerald-400 to-teal-600' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-20 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
                        Welcome, {userData?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'} 👋
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 mt-2 font-medium italic">SLIIT Campus Hub: Your personal operational footprint.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Link to="/user/book" className="flex-1 sm:flex-none px-6 py-3 bg-brand-600 text-white rounded-2xl font-black text-[10px] sm:text-xs text-center hover:bg-brand-700 transition shadow-xl shadow-brand-500/20 active:scale-95">Book Facility</Link>
                    <Link to="/user/tickets/new" className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] sm:text-xs text-center hover:bg-slate-50 transition shadow-sm active:scale-95">Report Issue</Link>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${c.color} opacity-5 rounded-bl-[4rem] group-hover:scale-110 transition-transform`} />
                        <div className="flex justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.color} text-white shadow-lg`}><c.icon className="w-4 h-4" /></div>
                        </div>
                        <h2 className="text-4xl font-display font-black text-slate-800 tracking-tight">{c.value}</h2>
                        <div className="mt-4 flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">{c.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Usage Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <h3 className="text-xl font-display font-black text-slate-900 mb-8 flex items-center gap-2">
                        My Activity Hub
                        <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">Usage Distribution</span>
                    </h3>
                    <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weekData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} />
                                <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '15px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                                />
                                <Bar dataKey="count" name="Reservations" fill="#4f46e5" radius={[12, 12, 0, 0]} barSize={45}>
                                    {stats.weekData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#4f46e5' : '#e2e8f0'} opacity={0.8 + (entry.count / 30)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Right Panel: Campus Profile */}
                <div className="space-y-8">
                    {/* Next Reservation Card */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500 rounded-full blur-[100px] opacity-20 -z-10 group-hover:scale-125 transition-transform duration-1000" />
                        <h3 className="text-xl font-display font-black mb-1">Upcoming Slot</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Confirmed Reservation</p>
                        
                        {stats.nextBooking ? (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-display font-black text-white leading-tight mb-2 uppercase">{stats.nextBooking.resourceId}</p>
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                        <MapPin className="w-4 h-4" /> SLIIT Malabe Campus
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 text-sm font-bold text-white mb-2">
                                        <Calendar className="w-4 h-4 text-brand-400" />
                                        {new Date(stats.nextBooking.startTime?.seconds * 1000 || stats.nextBooking.startTime).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                        <Clock className="w-4 h-4 text-brand-400" />
                                        {new Date(stats.nextBooking.startTime?.seconds * 1000 || stats.nextBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <PlusCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-sm">No upcoming confirmed slots.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Stats Panel */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                        className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-display font-black text-slate-800 mb-6">Personal Ratios</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval Success</span>
                                    <span className="text-sm font-black text-slate-800">{stats.successRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.successRate}%` }} className="h-full bg-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Resolution</span>
                                    <span className="text-sm font-black text-slate-800">{stats.ticketResRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ticketResRate}%` }} className="h-full bg-blue-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

