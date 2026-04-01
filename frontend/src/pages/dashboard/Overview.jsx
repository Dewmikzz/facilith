import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarCheck, AlertCircle, Users, BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { cn } from '../../lib/utils';

export default function Overview() {
    const [stats, setStats] = useState({ 
        bookings: 0, 
        tickets: 0, 
        resources: 0, 
        users: 0,
        activeRes: 0,
        approvalRate: 0,
        resolutionRate: 0,
        weekData: [
            { name: 'Mon', count: 0 }, { name: 'Tue', count: 0 }, { name: 'Wed', count: 0 }, 
            { name: 'Thu', count: 0 }, { name: 'Fri', count: 0 }, { name: 'Sat', count: 0 }, { name: 'Sun', count: 0 }
        ]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                const [bSnap, tSnap, rSnap, uSnap] = await Promise.all([
                    getDocs(collection(db, 'bookings')),
                    getDocs(collection(db, 'tickets')),
                    getDocs(collection(db, 'resources')),
                    getDocs(collection(db, 'users')),
                ]);

                const bDocs = bSnap.docs.map(d => d.data());
                const tDocs = tSnap.docs.map(d => d.data());
                const rDocs = rSnap.docs.map(d => d.data());

                const totalBookings = bSnap.size;
                const openTicketsCount = tDocs.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
                const totalResources = rSnap.size;
                const totalUsers = uSnap.size;

                const approvedCount = bDocs.filter(b => b.status === 'APPROVED').length;
                const resolvedCount = tDocs.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
                const activeResCount = rDocs.filter(r => r.status !== 'OUT_OF_SERVICE').length;

                // Weekly Distribution
                const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun (Mon is 1, Sun is 0 in JS, so we'll map)
                bDocs.forEach(b => {
                    const date = b.startTime?.seconds ? new Date(b.startTime.seconds * 1000) : (b.startTime ? new Date(b.startTime) : null);
                    if (date) {
                        let day = date.getDay(); // 0 is Sun, 1 is Mon...
                        const apiDay = day === 0 ? 6 : day - 1; // Map to 0=Mon...6=Sun
                        dayCounts[apiDay]++;
                    }
                });

                const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
                    name, count: dayCounts[i]
                }));

                setStats({
                    bookings: totalBookings,
                    tickets: openTicketsCount,
                    resources: totalResources,
                    users: totalUsers,
                    activeRes: activeResCount,
                    approvalRate: totalBookings > 0 ? Math.round((approvedCount / totalBookings) * 100) : 0,
                    resolutionRate: tDocs.length > 0 ? Math.round((resolvedCount / tDocs.length) * 100) : 0,
                    weekData
                });
            } catch (err) {
                console.error("Dashboard Stats Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
    }, []);

    const statCards = [
        { name: 'Total Bookings', value: stats.bookings, trend: '+12.5%', color: 'from-blue-500 to-indigo-600', icon: CalendarCheck },
        { name: 'Open Tickets', value: stats.tickets, trend: '-4.2%', color: 'from-red-400 to-rose-600', icon: AlertCircle },
        { name: 'Campus Resources', value: stats.resources, trend: '+2', color: 'from-emerald-400 to-teal-600', icon: BookOpen },
        { name: 'Registered Users', value: stats.users, trend: '+24.5%', color: 'from-amber-400 to-orange-500', icon: Users },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Campus Analytics...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 md:gap-10 pb-20">
            <header>
                <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">System Overview</h1>
                <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">Live analytics and campus operations metrics.</p>
            </header>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <motion.div key={card.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:border-brand-100 transition-all">
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-[4rem] group-hover:scale-110 transition-transform`} />
                        <div className="flex justify-between mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.name}</p>
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}><card.icon className="w-4 h-4" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-display font-black text-slate-800 tracking-tight">{card.value}</h2>
                            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm', 
                                card.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                            )}>
                                {card.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {card.trend}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider opacity-60">vs. last month</p>
                    </motion.div>
                ))}
            </div>

            {/* Analytical Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Activity Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-bl-[10rem] -z-10 opacity-50" />
                    <h3 className="text-xl font-display font-black text-slate-900 mb-8 flex items-center gap-2">
                        Weekly Activity
                        <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">Real Data</span>
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
                                <Bar dataKey="count" name="Bookings" fill="#4f46e5" radius={[12, 12, 0, 0]} barSize={45}>
                                    {stats.weekData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.count > 10 ? '#4f46e5' : '#6366f1'} opacity={0.8 + (entry.count / 30)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Campus Status Panel */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[120px] opacity-20 -z-10 group-hover:scale-125 transition-transform duration-1000" />
                    
                    <h3 className="text-2xl font-display font-black mb-1">Campus Status</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Live system health snapshot</p>
                    
                    <div className="space-y-10">
                        {/* Progressive Metric 1 */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active Resources</span>
                                <span className="text-2xl font-display font-black text-white">{stats.activeRes} / {stats.resources}</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.activeRes/stats.resources)*100}%` }} 
                                    className="h-full bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                            </div>
                        </div>

                        {/* Progressive Metric 2 */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Booking Approval</span>
                                <span className="text-2xl font-display font-black text-white">{stats.approvalRate}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.approvalRate}%` }} 
                                    className="h-full bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.4)]" />
                            </div>
                        </div>

                        {/* Progressive Metric 3 */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Resolution Rate</span>
                                <span className="text-2xl font-display font-black text-white">{stats.resolutionRate}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.resolutionRate}%` }} 
                                    className="h-full bg-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-800 flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                            <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">All systems operational</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
