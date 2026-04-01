import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users2, Calendar, Clock, ChevronRight, Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils';

const resources = [
    { id: 1, name: 'Main Auditorium', type: 'Lecture Hall', capacity: 250, floor: '1st Floor', status: 'AVAILABLE', img: 'bg-indigo-900' },
    { id: 2, name: 'Computer Lab B', type: 'Laboratory', capacity: 30, floor: '3rd Floor', status: 'BOOKED', img: 'bg-emerald-900' },
    { id: 3, name: 'Meeting Room 04', type: 'Workspace', capacity: 8, floor: '2nd Floor', status: 'AVAILABLE', img: 'bg-brand-900' },
    { id: 4, name: 'Physics Lab', type: 'Laboratory', capacity: 40, floor: '4th Floor', status: 'MAINTENANCE', img: 'bg-orange-900' },
];

export default function BookingCalendar() {
    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Resource Bookings</h1>
                    <p className="text-slate-500 mt-1 font-medium">Reserve halls, labs, and equipment instantly.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-semibold shadow-sm hover:bg-slate-50 transition">
                        My Bookings
                    </button>
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-500/30 flex items-center">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Book Resource
                    </button>
                </div>
            </div>

            {/* Filter and Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 mt-4">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="glass p-6 rounded-2xl h-full border border-slate-200/60 sticky top-24">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center"><Calendar className="w-4 h-4 mr-2 text-brand-600" /> Filter by Date</h3>
                        <div className="w-full h-10 bg-slate-100 rounded-lg flex items-center px-4 text-sm text-slate-600 mb-8 border border-slate-200">Today</div>
                        
                        <h3 className="font-semibold text-slate-900 mb-4">Resource Type</h3>
                        <div className="space-y-3">
                            {['Lecture Halls', 'Laboratories', 'Meeting Rooms', 'Special Equipment'].map(type => (
                                <label key={type} className="flex items-center group cursor-pointer">
                                    <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center mr-3 group-hover:border-brand-500 transition-colors"></div>
                                    <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resource Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {resources.map((resource, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={resource.id} 
                            className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                        >
                            {/* Card Image Area */}
                            <div className={cn("h-36 relative overflow-hidden", resource.img)}>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                                <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 text-white shadow-sm flex items-center gap-1">
                                    <div className={cn("w-2 h-2 rounded-full", resource.status === 'AVAILABLE' ? 'bg-emerald-400' : resource.status === 'BOOKED' ? 'bg-amber-400' : 'bg-red-500')}></div>
                                    {resource.status}
                                </div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="font-display font-bold text-lg mb-1 leading-none">{resource.name}</h3>
                                    <p className="text-xs font-medium opacity-80 uppercase tracking-widest">{resource.type}</p>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center justify-between text-sm text-slate-500 font-medium mb-5">
                                    <div className="flex items-center"><Users2 className="w-4 h-4 mr-2 text-slate-400" /> {resource.capacity} Seats</div>
                                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-slate-400" /> {resource.floor}</div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center text-sm font-semibold text-brand-600">
                                        <Clock className="w-4 h-4 mr-2" /> Next slot: 14:00
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
