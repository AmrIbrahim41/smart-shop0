import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { ENDPOINTS } from '../../api';
import { FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
// import { motion } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.access) {
          navigate('/');
        }
      } catch (e) {
        localStorage.removeItem('userInfo');
      }
    }
  }, [navigate]);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(ENDPOINTS.LOGIN, {
        username: formData.email.trim(),
        password: formData.password
      });

      const data = response.data;

      // Store JWT token and user info
      if (data.access) {
        localStorage.setItem('token', data.access);
        localStorage.setItem('refresh', data.refresh || '');
        localStorage.setItem('userInfo', JSON.stringify(data));

        // Update axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

        toast.success('Welcome back!', {
          icon: '👋',
          duration: 2000,
        });

        // Determine redirect path
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get('redirect');

        setTimeout(() => {
          if (data.isAdmin) {
            window.location.href = '/admin/dashboard';
          } else if (data.profile?.user_type === 'vendor') {
            window.location.href = '/dashboard';
          } else if (redirectPath) {
            window.location.href = `/${redirectPath}`;
          } else {
            window.location.href = '/';
          }
        }, 500);

      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error("Login Error:", err);
      
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.message ||
                           (err.response?.status === 401 ? "Invalid email or password" : 
                            err.response?.status === 403 ? "Account not activated. Check your email." :
                            "Connection error. Please try again.");
      
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500 px-4">
      <Meta title={`${t('login') || 'Login'} | SmartShop`} />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <FaLock className="text-2xl text-primary" />
              </div>
            </motion.div>
            
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {t('welcomeBack') || "Welcome Back"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t('loginSubtitle') || "Sign in to continue shopping"}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {t('email') || "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-bold placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-50"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                  {t('password') || "Password"}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-primary hover:text-orange-600 transition-colors"
                >
                  {t('forgotPasswordLink') || "Forgot?"}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-bold placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full relative overflow-hidden group bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>{t('loggingIn') || "Signing In..."}</span>
                  </>
                ) : (
                  <>
                    <span>{t('loginNow') || "SIGN IN"}</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t('dontHaveAccount') || "Don't have an account?"}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline ml-2"
              >
                {t('registerHere') || "Sign Up"}
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;