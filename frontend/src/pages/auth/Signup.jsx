import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function Signup() {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    
    // Step 1: Registration, Step 2: OTP Verification
    const [step, setStep] = useState(1);
    
    // User Data
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // OTP Data
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const MOCK_OTP = "123456"; // For presentation/testing without SMS gateway

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        
        try {
            setLoading(true);
            setError('');
            
            // Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Add their display name
            await updateProfile(user, { displayName: fullName });

            // Automatically push them to Step 2 for OTP Verification
            setStep(2);
            setSuccessMsg(`A verification code has been sent to ${email} (Use code: 123456 for testing)`);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await loginWithGoogle();
            const user = result.user;
            
            // Trust AuthContext onAuthStateChanged to handle profile creation/merging
            // This prevents race conditions and ensures names/photos are synced from Google.
            navigate('/');
        } catch (error) {
            setError('Google sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;
        
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Auto focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const verifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp !== MOCK_OTP) {
            setError("Invalid OTP. Try again.");
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Because they created their Auth account in Step 1, we now finalize it by creating their DB Record
            const user = auth.currentUser;
            if (user) {
                // Trust AuthContext for the actual doc creation to ensure uniform metadata
                // We just navigate to trigger the onAuthStateChanged listener
                navigate('/');
            }

            // Successfully Verified
            navigate('/');
        } catch (err) {
            setError("Failed to create user record: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-slate-50">
            {/* Left Box (Interactive/Animated Hero) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-gradient-to-br from-brand-50 to-indigo-100 overflow-hidden">
                <div className="absolute top-20 left-20 w-72 h-72 bg-brand-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-12"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-white/50 backdrop-blur-md rounded-full mb-8 shadow-xl border border-white/60">
                        <ShieldCheck className="w-12 h-12 text-brand-600" />
                    </div>
                    <h1 className="text-5xl font-display font-bold text-slate-800 mb-6 tracking-tight leading-tight">
                        Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Registration</span>
                    </h1>
                    <p className="text-lg text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                        Join the Smart Campus Operations Hub to access resources, handle bookings, and track your facility tickets.
                    </p>
                </motion.div>
            </div>

            {/* Right Box (Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 xs:p-12 relative z-10">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-md glass p-10 rounded-3xl"
                        >
                            <div className="mb-10 text-center lg:text-left">
                                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Create Account</h2>
                                <p className="text-slate-500">Sign up to get full campus access.</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSignup}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                    <div className="relative group">
                                        <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-medium"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                                    <div className="relative group">
                                        <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                        <input 
                                            type="email" 
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-medium"
                                            placeholder="john.doe@university.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                    <div className="relative group">
                                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                        <input 
                                            type="password" 
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-medium"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors" />
                                        <input 
                                            type="password" 
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-medium"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <motion.button 
                                    type="submit"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    disabled={loading}
                                    className={`w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center group hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Creating Account...' : 'Continue to Verification'}
                                    {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                </motion.button>
                            </form>

                            <div className="mt-8 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-[#F8FAFC] md:bg-white/10 text-slate-500 font-medium">Or</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <motion.button 
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleGoogleSignup}
                                    disabled={loading}
                                    className={`w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {loading ? 'Authenticating...' : 'Sign up with Google'}
                                </motion.button>
                            </div>

                            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                                Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800 transition">Log In</Link>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full max-w-md glass p-10 rounded-3xl"
                        >
                            <div className="mb-8 text-center">
                                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Verify OTP</h2>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                                    We sent a 6-digit one-time password to your contact method to verify your identity.
                                </p>
                            </div>

                            {successMsg && (
                                <div className="mb-6 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-4 py-3 rounded-xl text-center">
                                    {successMsg}
                                </div>
                            )}

                            <div className="flex justify-between items-center gap-2 mb-8 px-2">
                                {otp.map((data, index) => {
                                    return (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            value={data}
                                            onChange={(e) => handleOtpChange(e.target, index)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-12 h-14 bg-white/60 border border-slate-300 rounded-xl text-center text-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm"
                                        />
                                    );
                                })}
                            </div>

                            {error && (
                                <div className="flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}

                            <motion.button 
                                onClick={verifyOtp}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading || otp.join('').length < 6}
                                className={`w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all ${loading || otp.join('').length < 6 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </motion.button>
                            
                            <p className="mt-6 text-center text-sm font-medium text-slate-400">
                                Didn't receive the code? <button className="text-brand-600 font-bold hover:underline py-1">Resend Code</button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
