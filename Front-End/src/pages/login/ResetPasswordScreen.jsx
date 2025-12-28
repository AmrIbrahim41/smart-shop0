import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api'; 
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { FaLock, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordScreen = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const { t } = useSettings();

    // --- State ---
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);

    // --- Handler ---
    const submitHandler = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/api/users/reset-password/${uid}/${token}/`, {
                password, 
                confirmPassword
            });

            setMessage(t('passwordResetSuccess') || data.details || 'Password reset successful');
            
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || t('invalidToken') || 'Invalid or Expired Token');
        } finally {
            setLoading(false);
        }
    }, [password, confirmPassword, uid, token, t, navigate]);

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden">
            <Meta title={t('setNewPassword') || "Set New Password"} />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-10 transition-all hover:shadow-primary/10">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                            {t('newPasswordTitle') || "New Password"}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {t('newPasswordSubtitle') || "Create a strong password for your account."}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 p-4 rounded-2xl mb-6 text-sm font-bold text-center animate-bounce">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {message && (
                        <div className="bg-green-50 border border-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 p-6 rounded-2xl mb-6 text-center animate-fade-in">
                            <FaCheckCircle className="mx-auto text-4xl mb-2" />
                            <h3 className="font-bold text-lg">Successful!</h3>
                            <p className="text-sm">{message}</p>
                            <p className="text-xs text-gray-400 mt-2">Redirecting to login...</p>
                        </div>
                    )}

                    {!message && (
                        <form onSubmit={submitHandler} className="space-y-6">
                            
                            {/* Password Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t('newPasswordPlaceholder') || "New Password"}
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-11 pr-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold placeholder-gray-300 dark:placeholder-gray-600"
                                        required
                                    />
                                    {/* eye but*/}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t('confirmPasswordPlaceholder') || "Confirm Password"}
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-11 pr-12 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold placeholder-gray-300 dark:placeholder-gray-600"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed uppercase transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        {t('processing') || 'Processing...'}
                                    </>
                                ) : (
                                    t('resetPasswordBtn') || 'RESET PASSWORD'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;