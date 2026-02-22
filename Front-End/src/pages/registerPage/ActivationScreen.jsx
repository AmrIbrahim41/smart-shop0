import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import Meta from '../../components/tapheader/Meta';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';

const ActivationScreen = () => {
  const { uid, token } = useParams();
  const { t } = useSettings();

  const [status, setStatus] = useState('loading');
  const activationAttempted = useRef(false);

  useEffect(() => {
    if (activationAttempted.current) return;

    const activateAccount = async () => {
      activationAttempted.current = true;

      try {
        await api.post(`/api/users/activate/${uid}/${token}/`);
        setStatus('success');
      } catch (error) {
        console.error("Activation Error:", error);
        setStatus('error');
      }
    };

    activateAccount();
  }, [uid, token]);

  return (
    <div className="min-h-screen pt-40 px-6 bg-gray-50 dark:bg-gray-900 flex justify-center text-center transition-colors duration-500">
      <Meta title={t('activationTitle') || "Account Activation"} />

      <div className="max-w-md w-full">
        {/* Loading State */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <FaSpinner className="text-primary text-5xl animate-spin mb-6" />
            <h2 className="text-gray-900 dark:text-white text-2xl font-black">
              {t('activating') || "Activating your account..."}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait</p>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30 p-8 rounded-[2.5rem] shadow-xl"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
              {t('accountActivated') || "ACCOUNT ACTIVATED!"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
              {t('accountActivatedMsg') || "Your email has been verified. You can now login."}
            </p>
            
            <Link
              to="/login"
              className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-2xl transition shadow-lg hover:shadow-green-500/30 uppercase"
            >
              {t('loginNow') || "LOGIN NOW"}
            </Link>
          </motion.div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 p-8 rounded-[2.5rem] shadow-xl"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-4xl" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
              {t('activationFailed') || "ACTIVATION FAILED"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
              {t('activationFailedMsg') || "The activation link is invalid or expired."}
            </p>
            
            <Link
              to="/register"
              className="inline-block w-full bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-800 dark:text-white border border-gray-200 dark:border-transparent font-bold py-4 px-8 rounded-2xl transition shadow-sm uppercase"
            >
              {t('tryRegisterAgain') || "TRY AGAIN"}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActivationScreen;