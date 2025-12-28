import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const NotFound = () => {
  const { t } = useSettings();
  const location = useLocation(); 

  const missingPath = location.pathname;

  return (
    <div className="min-h-screen pt-24 px-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center transition-colors duration-500">
      <Meta title={t('pageNotFound') || "404 - Page Not Found"} />

      <div className="relative mb-8 group">
        <h1 className="text-[10rem] md:text-[12rem] font-black text-gray-200 dark:text-white/5 select-none transition-colors leading-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
            <FaExclamationTriangle className="text-6xl md:text-8xl text-primary animate-bounce drop-shadow-xl opacity-90" />
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
        {t('pageNotFound') || "Oops! Page Not Found"}
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-2 text-sm md:text-base leading-relaxed font-medium">
        {t('pageNotFoundMsg') || "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
      </p>
      
      <div className="mb-8 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg text-red-500 text-xs font-mono break-all">
        Requested URL: {missingPath}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/" 
            className="group relative bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden transform hover:-translate-y-1"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            <FaHome className="text-lg" /> 
            <span>{t('backToHome') || "GO HOME"}</span>
          </Link>

          <Link 
            to="/shop" 
            className="group relative bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 font-bold py-4 px-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1"
          >
            <FaSearch className="text-lg text-gray-400 group-hover:text-primary transition-colors" /> 
            <span>{t('browseProducts') || "BROWSE SHOP"}</span>
          </Link>
      </div>

    </div>
  );
};

export default memo(NotFound);