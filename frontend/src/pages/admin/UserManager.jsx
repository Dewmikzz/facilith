import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';
import { Users, ShieldCheck, Wrench, User, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const ROLE_STYLES = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    TECHNICIAN: 'bg-blue-100 text-blue-700 border-blue-200',
    USER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ROLE_ICONS = { ADMIN: ShieldCheck, TECHNICIAN: Wrench, USER: User };

export default function UserManager() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [saving, setSaving] = useState(null); // uid of the row being saved
    const [saved, setSaved] = useState(null);   // uid of the row that just saved

    useEffect(() => {
        // Fetch all users sorted by most recent first
        const unsub = onSnapshot(collection(db, 'users'), snap => {
            const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // ROBUST SORT: Use timestamp seconds if available, otherwise use a high number (NOW) to put new users at top
            setUsers(allUsers.sort((a, b) => {
                const timeA = a.createdAt?.seconds || Date.now() / 1000;
                const timeB = b.createdAt?.seconds || Date.now() / 1000;
                return timeB - timeA;
            }));
        }, (err) => {
            console.error("User list fetch error:", err);
            alert("Permission denied or error fetching user list.");
        });
        return unsub;
    }, []);

    const changeRole = async (uid, newRole) => {
        setSaving(uid);
        try {
            // Update Firestore for immediate UI feedback
            await updateDoc(doc(db, 'users', uid), { role: newRole });

            // Call backend API to sync Custom Claims
            const token = await currentUser.getIdToken();
            await fetch(`${API_BASE_URL}/api/users/${uid}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });

            setSaved(uid);
            setTimeout(() => setSaved(null), 2000);
        } catch (e) {
            console.error('Role update failed', e);
        } finally {
            setSaving(null);
        }
    };

    const filteredUsers = filter === 'ALL' ? users : users.filter(u => u.role === filter);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <div className="px-4 md:px-0">
                <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 tracking-tight">User Management</h1>
                <p className="text-slate-500 mt-2 text-sm md:text-lg">View registered users and manage their access roles.</p>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex gap-3 flex-wrap px-4 md:px-0">
                {['ALL', 'ADMIN', 'TECHNICIAN', 'USER'].map(r => (
                    <button key={r} onClick={() => setFilter(r)}
                        className={cn('px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all',
                            filter === r ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300')}>
                        {r} <span className={cn("ml-2 px-2 py-0.5 rounded-md", filter === r ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                            {r === 'ALL' ? users.length : users.filter(u => u.role === r).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mx-4 md:mx-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-max md:min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['User Info', 'Email', 'Current Role', 'Reassign Role'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center text-slate-400 bg-slate-50/50">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p className="font-semibold text-xl text-slate-500">No {filter !== 'ALL' ? filter.toLowerCase() : ''} users found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, i) => {
                                    const RoleIcon = ROLE_ICONS[u.role] || User;
                                    return (
                                        <motion.tr key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="hover:bg-brand-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0 border border-brand-200/50 shadow-sm group-hover:scale-110 transition-transform">
                                                        {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-base">{u.fullName || '—'}</span>
                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">UID: {u.id.substring(0,8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border tracking-wide shadow-sm whitespace-nowrap', ROLE_STYLES[u.role] || ROLE_STYLES.USER)}>
                                                    <RoleIcon className="w-3.5 h-3.5" /> {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={u.role}
                                                        disabled={saving === u.id || u.id === currentUser.uid} // Prevent changing own role
                                                        onChange={e => changeRole(u.id, e.target.value)}
                                                        className="w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 hover:border-brand-300 transition-all disabled:opacity-50 disabled:bg-slate-100">
                                                        <option value="USER">USER</option>
                                                        <option value="TECHNICIAN">TECHNICIAN</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                    </select>
                                                    
                                                    <div className="w-20">
                                                        {saving === u.id && (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Saving
                                                            </span>
                                                        )}
                                                        {saved === u.id && (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
