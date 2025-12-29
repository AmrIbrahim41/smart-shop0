import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Paginate from '../../components/paginate/Paginate';
import ProductCarousel from '../../components/slider/ProductCarousel';
import Meta from '../../components/tapheader/Meta';
import ProductCard from '../../components/productcard/ProductCard';
import { useSettings } from '../../context/SettingsContext';
import api, { ENDPOINTS } from '../../api'; 
import { FaFilter, FaFire, FaSync } from 'react-icons/fa';

const HomeScreen = () => {
  // --- State Management ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const keyword = searchParams.get('keyword') || '';
  const pageNumber = searchParams.get('page') || 1;

  // --- Fetch Logic ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(ENDPOINTS.PRODUCTS, {
        params: {
            keyword: keyword,
            page: pageNumber
        }
      });
      
      setProducts(data.products || data); 
      setPage(data.page || 1);
      setPages(data.pages || 1);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) { 
        console.error("Home Fetch Error:", err);
        setError(err.response?.data?.message || "Failed to load products");
    } finally {
        setLoading(false);
    }
  }, [keyword, pageNumber]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const isMainHome = !keyword && String(pageNumber) === '1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Meta title={keyword ? `${keyword} - Search Results` : t('SmartShop') || "Home | SmartShop"} />

      {isMainHome && !error && (
        <div className="pt-20 md:pt-24 px-4 max-w-[1400px] mx-auto mb-6">
            <ProductCarousel />
        </div>
      )}

      {/* Main Container */}
      <div className={`max-w-[1400px] mx-auto px-4 pb-24 ${!isMainHome ? 'pt-24' : ''}`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 border-b border-gray-200 dark:border-white/5 pb-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-2 uppercase">
                    {keyword ? `Results for "${keyword}"` : (
                        <>
                            {t('latestProducts') || "LATEST PRODUCTS"}
                            <FaFire className="text-orange-500 animate-pulse text-2xl" />
                        </>
                    )}
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-medium">
                    {loading ? 'Updating catalog...' : `${products.length} Items Displayed`}
                </p>
            </div>
            
            {!loading && !error && (
                <button 
                    onClick={fetchProducts}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition"
                >
                    <FaSync /> Refresh
                </button>
            )}
        </div>

        {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                <button 
                    onClick={fetchProducts} 
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg"
                >
                    Try Again
                </button>
            </div>
        ) : loading ? (
            /* Loading Skeletons */
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-gray-200 dark:bg-gray-800 rounded-[2rem] animate-pulse"></div>
                ))}
            </div>
        ) : products.length > 0 ? (
            /* Products Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id || product._id} product={product} />
                ))}
            </div>
        ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FaFilter size={30}/>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                <button onClick={() => navigate('/')} className="mt-6 text-primary font-bold underline hover:text-orange-600 transition">
                    View All Products
                </button>
            </div>
        )}

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
            <div className="mt-16 flex justify-center pb-10">
                <Paginate pages={pages} page={page} keyword={keyword ? keyword : ''} />
            </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;