import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login, loginAsGuest, authToken, userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect away if already logged in or in guest mode
        if (authToken || userRole === 'GUEST') {
            navigate('/dashboard', { replace: true });
        }
        loadSavedCredentials();
    }, [authToken, userRole]);

    const loadSavedCredentials = () => {
        const savedEmail = localStorage.getItem('savedEmail');
        const savedPassword = localStorage.getItem('savedPassword');
        const savedRememberMe = localStorage.getItem('rememberMe');

        if (savedRememberMe === 'true' && savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }
    };

    const saveCredentials = () => {
        if (rememberMe) {
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('savedEmail');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('rememberMe');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter email and password', {
                style: {
                    borderRadius: '12px',
                    background: '#1E293B',
                    color: '#fff',
                    padding: '16px',
                    fontWeight: '600',
                },
            });
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.login(email, password);

            if (response && response.access_token) {
                saveCredentials();
                await login(response);
                toast.success('Welcome back!', {
                    icon: '👋',
                    style: {
                        borderRadius: '12px',
                        background: '#1E293B',
                        color: '#fff',
                        padding: '16px',
                        fontWeight: '600',
                    },
                });
                navigate('/dashboard');
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            toast.error(error.message || 'Login failed', {
                style: {
                    borderRadius: '12px',
                    background: '#1E293B',
                    color: '#fff',
                    padding: '16px',
                    fontWeight: '600',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        loginAsGuest();
        toast.success('Welcome, Guest!', {
            icon: '🎉',
            style: {
                borderRadius: '12px',
                background: '#1E293B',
                color: '#fff',
                padding: '16px',
                fontWeight: '600',
            },
        });
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-white flex flex-col items-center justify-center p-4 sm:p-10 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] my-auto"
            >
                {/* Logo/Icon Area */}
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#2563EB] flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-blue-600/20">
                        <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 text-white">
                            <rect x="25" y="25" width="50" height="50" rx="6" fill="white" />
                            <path d="M25,35 H20 V40 H25 M25,45 H20 V50 H25 M25,55 H20 V60 H25" fill="none" stroke="white" strokeWidth="4" />
                            <rect x="32" y="32" width="36" height="36" rx="2" fill="#E2E8F0" opacity="0.5" />
                            <path d="M45,52 L52,59 L70,40" fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900 mb-1 sm:mb-2 font-outfit">Welcome Back</h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium text-center mb-6 sm:mb-8">Sign in to continue to IB E-Diary</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold dark:text-white text-slate-900 mb-1.5 ml-1">
                            Email Address
                        </label>
                        <div className="relative flex items-center">
                            <div
                                className="absolute left-4 text-slate-400 z-10 flex items-center justify-center"
                                style={{ height: '56px', width: '24px' }}
                            >
                                <MdEmail size={22} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '52px' }}
                                className="w-full h-12 sm:h-14 pr-4 dark:bg-slate-900 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-xl sm:rounded-2xl dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold dark:text-white text-slate-900 mb-1.5 sm:mb-2 ml-1">
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <div
                                className="absolute left-4 text-slate-400 z-10 flex items-center justify-center"
                                style={{ height: '56px', width: '24px' }}
                            >
                                <MdLock size={22} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '52px' }}
                                className="w-full h-12 sm:h-14 pr-12 dark:bg-slate-900 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-xl sm:rounded-2xl dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm sm:text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-slate-400 hover:text-slate-600 z-10 flex items-center justify-center cursor-pointer"
                                style={{ height: '56px' }}
                            >
                                {showPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between py-2 sm:py-3">
                        <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
                            <div className="relative flex items-center justify-center w-6 h-6">
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="peer absolute opacity-0 w-full h-full cursor-pointer z-20"
                                />
                                <div className="w-6 h-6 border-2 border-slate-300 rounded-lg transition-all duration-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 group-hover:border-blue-400 shadow-sm peer-checked:shadow-lg peer-checked:shadow-blue-600/30"></div>
                                <motion.span
                                    initial={false}
                                    animate={{
                                        scale: rememberMe ? 1 : 0.5,
                                        opacity: rememberMe ? 1 : 0,
                                        rotate: rememberMe ? 0 : -45
                                    }}
                                    className="absolute text-white pointer-events-none z-10 flex items-center justify-center"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[3.5] stroke-linecap-round stroke-linejoin-round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </motion.span>
                            </div>
                            <span className="text-sm sm:text-base font-semibold text-slate-500 group-hover:text-blue-500 transition-colors">
                                Remember me
                            </span>
                        </label>
                        <button type="button" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline">
                            Forgot Password?
                        </button>
                    </div>

                    {/* Login Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 sm:h-14 bg-[#2563EB] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Logging In...</span>
                            </div>
                        ) : (
                            'Log In'
                        )}
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-1 sm:py-2">
                        <div className="flex-1 h-px dark:bg-slate-800 bg-slate-200"></div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">or</span>
                        <div className="flex-1 h-px dark:bg-slate-800 bg-slate-200"></div>
                    </div>

                    {/* Guest Button */}
                    <motion.button
                        whileHover={{ scale: 1.01, backgroundColor: '#F8FAFC' }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="w-full h-12 sm:h-14 dark:bg-slate-900 bg-slate-50 dark:border-white/5 border-slate-200 border dark:text-slate-300 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base dark:hover:bg-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        Continue as Guest
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
