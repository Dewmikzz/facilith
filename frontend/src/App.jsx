import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Admin Pages
import Overview from './pages/dashboard/Overview';
import ResourceManager from './pages/admin/ResourceManager';
import BookingRequests from './pages/admin/BookingRequests';
import AllTickets from './pages/admin/AllTickets';
import UserManager from './pages/admin/UserManager';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import MyBookings from './pages/user/MyBookings';
import MyTickets from './pages/user/MyTickets';
import CreateTicket from './pages/user/CreateTicket';
import BookResource from './pages/user/BookResource';

// Technician Pages
import TechDashboard from './pages/technician/TechDashboard';
import AssignedTickets from './pages/technician/AssignedTickets';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, role } = useAuth();
    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
    return children;
};

const AuthRoute = ({ children }) => {
    const { currentUser } = useAuth();
    if (currentUser) return <Navigate to="/" replace />;
    return children;
};

const RoleRedirect = () => {
    const { role } = useAuth();
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TECHNICIAN') return <Navigate to="/tech" replace />;
    return <Navigate to="/user" replace />;
};

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
                    <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

                    {/* ADMIN Routes */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
                        <Route index element={<Overview />} />
                        <Route path="resources" element={<ResourceManager />} />
                        <Route path="bookings" element={<BookingRequests />} />
                        <Route path="tickets" element={<AllTickets />} />
                        <Route path="users" element={<UserManager />} />
                    </Route>

                    {/* USER Routes */}
                    <Route path="/user" element={<ProtectedRoute allowedRoles={['USER']}><DashboardLayout /></ProtectedRoute>}>
                        <Route index element={<UserDashboard />} />
                        <Route path="bookings" element={<MyBookings />} />
                        <Route path="tickets" element={<MyTickets />} />
                        <Route path="tickets/new" element={<CreateTicket />} />
                        <Route path="book" element={<BookResource />} />
                    </Route>

                    {/* TECHNICIAN Routes */}
                    <Route path="/tech" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><DashboardLayout /></ProtectedRoute>}>
                        <Route index element={<TechDashboard />} />
                        <Route path="tickets" element={<AssignedTickets />} />
                    </Route>

                    <Route path="/unauthorized" element={<div className="flex h-screen items-center justify-center text-slate-600 font-display text-2xl">Access Denied</div>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
