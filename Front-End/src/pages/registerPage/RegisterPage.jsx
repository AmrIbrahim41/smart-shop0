import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Meta from '../../components/tapheader/Meta';
import { FaPhone, FaUserTag, FaUser, FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api'; 

const RegisterScreen = () => {
    const { t } = useSettings();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        type: 'customer' // Default type
    });

    const [status, setStatus] = useState({
        loading: false,
        error: null,
        successMessage: null
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) { navigate('/'); }
    }, [navigate]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (status.error) setStatus(prev => ({ ...prev, error: null }));
    };

    const handleTypeChange = (newType) => {
        setFormData(prev => ({ ...prev, type: newType }));
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setStatus({ ...status, error: t('passwordsDoNotMatch') || 'Passwords do not match' });
            return;
        }

        try {
            setStatus({ loading: true, error: null, successMessage: null });
            
            const { data } = await api.post('/api/users/register/', {
                'first_name': formData.firstName,
                'last_name': formData.lastName,
                'email': formData.email,
                'password': formData.password,
                'phone': formData.phone,
                'type': formData.type
            });

            setStatus({ 
                loading: false, 
                error: null, 
                successMessage: data.details || 'Registration Successful! Please verify your email.' 
            });

        } catch (err) {
            console.error("Register Error:", err);
            setStatus({ 
                loading: false, 
                error: err.response?.data?.detail || err.message || "Registration failed", 
                successMessage: null 
            });
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center py-20 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden">
            <Meta title={t('registerTitle') || "Register"} />

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-10 transition-all duration-300">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase">
                            {t('registerTitle') || "Create Account"}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                            {t('registerSubtitle') || "Join us and start your journey today"}
                        </p>
                    </div>

                    {status.error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-center text-sm font-bold animate-bounce">
                            ⚠️ {status.error}
                        </div>
                    )}

                    {status.successMessage ? (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400 p-8 rounded-3xl text-center animate-fade-in">
                            <h3 className="font-bold text-2xl mb-2">🎉 {t('successRegister') || "Verify Email!"}</h3>
                            <p className="font-medium">{status.successMessage}</p>
                            <Link to="/login" className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg">
                                {t('loginNow') || "Go to Login"}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submitHandler} className="space-y-5">
                            
                            {/* Names Row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-2 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('firstName') || "First Name"}</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('lastName') || "Last Name"}</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('phone') || "Phone"}</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                        placeholder="+1 234 567 890"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('email') || "Email"}</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Type Selector */}
                            <div className="p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl flex border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('customer')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                                        formData.type === 'customer' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <FaUserTag /> {t('buyer') || "Buyer"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('vendor')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                                        formData.type === 'vendor' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <FaUserTag /> {t('seller') || "Seller"}
                                </button>
                            </div>

                            {/* Passwords */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('password') || "Password"}</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-10 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                    {/* eye but*/}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition focus:outline-none"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('confirmPassword') || "Confirm"}</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status.loading}
                                className="w-full group bg-gradient-to-r from-primary to-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {status.loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{t('processing') || "Creating Account..."}</span>
                                    </>
                                ) : (
                                    <>
                                        {t('registerBtn') || "CREATE ACCOUNT"} <FaArrowRight className="group-hover:translate-x-1 transition-transform"/>
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4 border-t border-gray-100 dark:border-white/5">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    {t('haveAccount') || "Already have an account?"} <Link to="/login" className="text-primary font-bold hover:underline ml-1">{t('login') || "Login here"}</Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;