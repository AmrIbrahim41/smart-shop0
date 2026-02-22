import React, { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaSearch, FaArrowLeft } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';

const NotFound = () => {
  const { t } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const missingPath = location.pathname;

  return (
    <div className="min-h-screen pt-24 px-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center transition-colors duration-500">
      <Meta title={t('pageNotFound') || "404 - Page Not Found"} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        {/* 404 Number with Icon */}
        <div className="relative mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10rem] md:text-[12rem] font-black text-gray-200 dark:text-white/5 select-none leading-none"
          >
            404
          </motion.h1>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-6xl text-primary animate-bounce" />
            </div>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight"
        >
          {t('pageNotFound') || "Oops! Page Not Found"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-500 dark:text-gray-400 max-w-lg mb-4 text-sm md:text-base leading-relaxed font-medium mx-auto"
        >
          {t('pageNotFoundMsg') || "The page you're looking for might have been removed or doesn't exist."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-8 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-red-500 text-xs font-mono break-all inline-block"
        >
          {missingPath}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>GO BACK</span>
          </button>

          <Link
            to="/"
            className="group relative bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <FaHome />
            <span>GO HOME</span>
          </Link>

          <Link
            to="/shop"
            className="group flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 font-bold py-4 px-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <FaSearch className="text-gray-400 group-hover:text-primary transition-colors" />
            <span>BROWSE SHOP</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default memo(NotFound);