import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Paginate from '../../components/paginate/Paginate';
import ProductCarousel from '../../components/slider/ProductCarousel';
import Meta from '../../components/tapheader/Meta';
import ProductCard from '../../components/productcard/ProductCard';
import { useSettings } from '../../context/SettingsContext';
import api, { ENDPOINTS } from '../../api';
import { FaFilter, FaFire, FaSync, FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const HomeScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const keyword = searchParams.get('keyword') || '';
  const pageNumber = parseInt(searchParams.get('page')) || 1;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(ENDPOINTS.PRODUCTS, {
        params: {
          keyword: keyword || undefined,
          page: pageNumber
        }
      });

      if (data.products) {
        setProducts(data.products);
        setPage(data.page || 1);
        setPages(data.pages || 1);
        setTotal(data.total || data.products.length);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setPage(1);
        setPages(1);
        setTotal(data.length);
      } else {
        setProducts([]);
        setPage(1);
        setPages(1);
        setTotal(0);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error("Home Fetch Error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to load products";
      setError(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, pageNumber]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const isMainHome = !keyword && pageNumber === 1;

  return (
    // استخدام <main> بدلاً من <div> للمعايير القياسية
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Meta 
        title={keyword ? `${keyword} - Search Results | SmartShop` : t('home') || "Home | SmartShop"} 
        description={keyword ? `Search results for "${keyword}"` : "Discover the best products at SmartShop"}
      />

      {isMainHome && !error && (
        <section className="pt-20 md:pt-24 px-4 max-w-[1400px] mx-auto mb-6" aria-label="Featured Products Carousel">
          <ProductCarousel />
        </section>
      )}

      <section className={`max-w-[1400px] mx-auto px-4 pb-24 ${!isMainHome ? 'pt-24' : ''}`} aria-live="polite">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-gray-200 dark:border-white/5 pb-4">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.h1
                key={keyword || 'default'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3 uppercase"
              >
                {keyword ? (
                  <>
                    <FaSearch className="text-primary" aria-hidden="true" />
                    Results for "{keyword}"
                  </>
                ) : (
                  <>
                    {t('latestProducts') || "LATEST PRODUCTS"}
                    <FaFire className="text-orange-500 animate-pulse" aria-hidden="true" />
                  </>
                )}
              </motion.h1>
            </AnimatePresence>
            
            <p className="text-gray-400 text-sm mt-2 font-medium">
              {loading 
                ? 'Loading products...' 
                : error 
                  ? 'Error loading products'
                  : `${total} ${total === 1 ? 'Product' : 'Products'} Found`
              }
            </p>
          </div>

          {!loading && !error && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchProducts}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 focus:ring-2 focus:ring-primary focus:outline-none"
              aria-label="Refresh product list"
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
            className="flex flex-col items-center justify-center py-20 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30"
            role="alert"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
              <FaFilter size={32} aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg hover:shadow-red-500/30 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Loading products">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] animate-pulse relative overflow-hidden"
              />
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id || product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-400">
              <FaFilter size={40} aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-md">
              {keyword 
                ? `We couldn't find any products matching "${keyword}". Try different keywords or browse all products.`
                : "No products available at the moment. Check back soon!"
              }
            </p>
            {keyword && (
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-6 py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg hover:shadow-primary/30 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                View All Products
              </button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <nav className="mt-16 flex justify-center pb-10" aria-label="Product Pagination">
            <Paginate pages={pages} page={page} keyword={keyword} />
          </nav>
        )}
      </section>
    </main>
  );
};

export default HomeScreen;