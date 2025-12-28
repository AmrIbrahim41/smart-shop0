import React, { useState, useCallback } from 'react';
import api from '../../api'; 
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { FaEnvelope, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

const ForgotPasswordScreen = () => {
    // --- State Management ---
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    
    const { t } = useSettings();

    // --- Handler (Performance: useCallback) ---
    const submitHandler = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const { data } = await api.post('/api/users/forgot-password/', { email });
            
            setMessage(data.details || 'Check your email for a reset link!');
            setIsError(false);
        } catch (error) {
            console.error("Forgot Password Error:", error);
            setMessage(error.response?.data?.detail || 'Error sending email. Please check the address.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }, [email]);

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden">
            <Meta title={t('forgotPassword') || "Forgot Password"} />
            
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-5%] left-[20%] w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-10 transition-all hover:shadow-primary/10">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce">
                            <FaPaperPlane />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                            {t('forgotPassword') || "Reset Password"}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {t('resetInstructions') || "Enter your email and we'll send you a link to reset your password."}
                        </p>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`p-4 rounded-2xl text-sm font-bold mb-6 text-center animate-fade-in border ${
                            isError 
                            ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' 
                            : 'bg-green-50 border-green-100 text-green-600 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400'
                        }`}>
                            {message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={submitHandler} className="space-y-6">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t('enterEmail') || "Email Address"}
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-11 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder="example@mail.com"
                                    required 
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {t('sending') || 'Sending...'}
                                </>
                            ) : (
                                t('sendResetLink') || 'SEND RESET LINK'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <a href="/login" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold hover:text-primary transition-colors text-sm">
                            <FaArrowLeft /> {t('backToLogin') || "Back to Login"}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordScreen;