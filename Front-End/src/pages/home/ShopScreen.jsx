import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import ProductCard from '../../components/productcard/ProductCard';
import Meta from '../../components/tapheader/Meta';
import { FaStore, FaSync, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CategorySection = ({ category, index }) => {
  const rowRef = useRef(null);

  // تحديث التمرير ليكون ديناميكي بناءً على عرض الشاشة الفعلي بدلاً من رقم ثابت
  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75; // التمرير بنسبة 75% من عرض الشاشة الظاهر
      rowRef.current.scrollBy({ 
        left: direction === 'right' ? scrollAmount : -scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-16 border-b border-gray-200 dark:border-white/5 pb-12 last:border-0"
      aria-labelledby={`category-heading-${category.id || index}`}
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 px-4 md:px-0 gap-4">
        <div>
          <h2 id={`category-heading-${category.id || index}`} className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="w-1.5 h-8 bg-primary rounded-full" aria-hidden="true"></span>
            {category.name}
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-bold ml-5">
            {category.products?.length || 0} Products available
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* رابط "عرض الكل" كحل بديل للـ Pagination في العرض الأفقي */}
          <Link 
            to={`/?category=${category.id || category._id}`} // تأكد أن صفحة Home تستقبل هذا الباراميتر إذا أردت فلترة
            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-orange-600 transition group"
          >
            View All <FaArrowRight className="transform group-hover:translate-x-1 transition-transform" />
          </Link>

          {category.products?.length > 4 && (
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Scroll ${category.name} left`}
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Scroll ${category.name} right`}
              >
                <FaChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative group px-4 md:px-0">
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-2 scroll-smooth hide-scrollbar snap-x snap-mandatory focus:outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          tabIndex="0"
          role="region"
          aria-label={`${category.name} products`}
        >
          {category.products && category.products.length > 0 ? (
            category.products.map((product) => (
              <div
                key={product.id || product._id}
                className="w-[280px] md:w-[300px] flex-none snap-start transform transition duration-300 hover:scale-[1.02]"
              >
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="w-full text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 text-gray-400">
              No products available in this category
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

const ShopScreen = () => {
  const [shopData, setShopData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShopData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get('/api/products/shop-view/');
      setShopData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching shop data:", err);
      const errorMsg = err.response?.data?.detail || "Failed to load categories";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  if (loading) {
    return (
      <main className="min-h-screen pt-28 px-4 bg-gray-50 dark:bg-gray-950" aria-busy="true">
        <div className="max-w-[1400px] mx-auto">
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-12 animate-pulse"></div>
          {[1, 2].map((i) => (
            <div key={i} className="mb-16">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6 animate-pulse"></div>
              <div className="flex gap-6 overflow-hidden">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-[380px] w-[300px] bg-gray-200 dark:bg-gray-800 rounded-3xl flex-shrink-0 animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 transition-colors duration-500">
      <Meta title="Shop Collections | SmartShop" />

      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2 flex items-center gap-3"
            >
              <FaStore className="text-primary" aria-hidden="true" />
              Shop Collections
            </motion.h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              Browse products by category
            </p>
          </div>

          {!loading && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchShopData}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 focus:ring-2 focus:ring-primary focus:outline-none"
              aria-label="Refresh categories"
            >
              <FaSync className="text-xs" aria-hidden="true" /> Refresh
            </motion.button>
          )}
        </header>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-10 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 mb-10"
            role="alert"
          >
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={fetchShopData}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/30 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Categories */}
        {!loading && !error && (
          <div aria-live="polite">
            <AnimatePresence>
              {shopData.length > 0 ? (
                shopData.map((category, index) => (
                  <CategorySection key={category.id || category._id} category={category} index={index} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 bg-white dark:bg-white/5 rounded-[3rem] shadow-sm"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                    <FaStore size={40} aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Categories Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Check back soon for new products!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
};

export default ShopScreen;