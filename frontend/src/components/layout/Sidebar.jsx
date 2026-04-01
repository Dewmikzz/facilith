import React from 'react';
import logoFacilith from '../../assets/logo-facilith.png';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Ticket, Users, BarChart3, Settings, Wrench, BookOpen, PlusCircle, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Resources', href: '/admin/resources', icon: BookOpen },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Users', href: '/admin/users', icon: Users },
];

const userNav = [
    { name: 'Dashboard', href: '/user', icon: Home },
    { name: 'My Bookings', href: '/user/bookings', icon: CalendarDays },
    { name: 'Book Resource', href: '/user/book', icon: PlusCircle },
    { name: 'My Tickets', href: '/user/tickets', icon: Ticket },
    { name: 'Report Issue', href: '/user/tickets/new', icon: PlusCircle },
];

const techNav = [
    { name: 'Dashboard', href: '/tech', icon: Home },
    { name: 'Assigned Tickets', href: '/tech/tickets', icon: Wrench },
];

export default function Sidebar({ isMobile, onClose }) {
    const { role } = useAuth();
    const navigation = role === 'ADMIN' ? adminNav
        : role === 'TECHNICIAN' ? techNav
        : userNav;

    return (
        <div className={cn(
            "flex z-20 h-full flex-col bg-white border-r border-slate-200 transition-all duration-300",
            isMobile ? "w-full" : "w-64"
        )}>
            <div className="flex h-20 shrink-0 items-center justify-center px-6 border-b border-slate-100">
                <img
                    src={logoFacilith}
                    alt="Facilith"
                    className="h-14 w-auto object-contain transition-opacity duration-300"
                    style={{ imageRendering: 'auto' }}
                />
            </div>
            
            <nav className="flex flex-1 flex-col mt-6 overflow-y-auto">
                <ul role="list" className="flex flex-1 flex-col gap-y-2 px-4 pb-6">
                    {navigation.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.href}
                                end={item.href.split('/').length <= 2}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    cn(
                                        isActive
                                            ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm'
                                            : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50',
                                        'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 transition-all'
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
                <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl p-4 border border-brand-100/50 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 rounded-full blur-xl"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-700 mb-1">{role}</p>
                    <p className="text-sm font-semibold text-slate-800">Support Hub</p>
                    <p className="text-[11px] text-slate-500 mt-1 mb-3 leading-snug font-medium">Connect with Campus Admin</p>
                    <button className="w-full py-2 bg-[#25D366] text-[10px] font-black uppercase tracking-widest text-white rounded-lg shadow-md border hover:bg-[#128C7E] transition-all flex items-center justify-center gap-1.5 border-transparent">
                         <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}
