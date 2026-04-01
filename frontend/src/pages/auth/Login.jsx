import React, { useState } from 'react';
import logoFacilith from '../../assets/logo-facilith.png';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please fill in all fields.'); return; }
        try {
            setLoading(true);
            setError('');
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await loginWithGoogle();
            const user = result.user;
            
            // Sync Google profile data to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                fullName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: 'USER', // won't overwrite existing role if merger
                createdAt: serverTimestamp()
            }, { merge: true });

            navigate('/dashboard');
        } catch (error) {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-slate-50">
            {/* Left Box (Interactive/Animated Hero) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-gradient-to-br from-brand-50 to-accent-100 overflow-hidden">
                {/* Abstract Blobs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-brand-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-12"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-white/50 backdrop-blur-md rounded-full mb-8 shadow-xl border border-white/60">
                        <BookOpen className="w-12 h-12 text-brand-600" />
                    </div>
                    <h1 className="text-5xl font-display font-bold text-slate-800 mb-6 tracking-tight leading-tight">
                        Powering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600">Smart Campus</span>
                    </h1>
                    <p className="text-lg text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                        Seamlessly book resources, track maintenance incidents, and analyze facility metrics in real-time.
                    </p>
                </motion.div>
            </div>

            {/* Right Box (Login Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 xs:p-12 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md glass p-10 rounded-3xl"
                >
                    <div className="mb-10 text-center">
                        <img src={logoFacilith} alt="Facilith" className="h-16 w-auto object-contain mx-auto mb-8" />
                        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleEmailLogin}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                            <div className="relative group">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                <input 
                                    type="email" 
                                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                    placeholder="Enter your university email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                <input 
                                    type="password" 
                                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                            <label className="ml-2 text-sm text-slate-600">Remember me for 30 days</label>
                        </div>

                        <motion.button 
                            type="submit"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            disabled={loading}
                            className={`w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center group hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Signing in...' : 'Log In'}
                            {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                        </motion.button>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#F8FAFC] md:bg-white/10 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-8">
                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {loading ? 'Authenticating...' : 'Sign in with Google'}
                        </motion.button>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Don't have an account? <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700 transition">Sign up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
