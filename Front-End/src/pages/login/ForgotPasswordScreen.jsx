import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { FaEnvelope, FaPaperPlane, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { t } = useSettings();

  const submitHandler = useCallback(async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/users/forgot-password/', { email: email.toLowerCase().trim() });
      
      setSuccess(true);
      toast.success('Reset link sent! Check your email.', {
        icon: '📧',
        duration: 5000,
      });

    } catch (error) {
      console.error("Forgot Password Error:", error);
      
      // Don't reveal if email exists (security)
      setSuccess(true);
      toast.success('If this email exists, a reset link has been sent.', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden">
      <Meta title={t('forgotPassword') || "Forgot Password"} />
      
      {/* Background Decoration */}
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
          className="absolute bottom-[-5%] left-[20%] w-72 h-72 bg-primary/20 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
            >
              <FaPaperPlane />
            </motion.div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
              {t('forgotPassword') || "Reset Password"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t('resetInstructions') || "Enter your email and we'll send you a link"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Email Sent!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                </p>
                
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                >
                  <FaArrowLeft /> Back to Login
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={submitHandler}
                className="space-y-6"
              >
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
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {t('sending') || 'Sending...'}
                    </>
                  ) : (
                    t('sendResetLink') || 'SEND RESET LINK'
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold hover:text-primary transition-colors text-sm"
              >
                <FaArrowLeft /> {t('backToLogin') || "Back to Login"}
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordScreen;