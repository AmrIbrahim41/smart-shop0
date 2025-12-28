import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api'; 
import ProductCard from '../../components/productcard/ProductCard';
import Meta from '../../components/tapheader/Meta';
import { FaStore, FaLayerGroup, FaSync, FaExclamationTriangle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CategorySection = ({ category }) => {
    const rowRef = useRef(null);

    const scroll = (offset) => {
        if (rowRef.current) {
            rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-12 animate-fade-in-up border-b border-gray-200 dark:border-white/5 pb-8 last:border-0">
            
            <div className="flex justify-between items-end mb-6 px-4 md:px-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                        {category.name}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1 font-bold ml-4">
                        {category.products?.length} Items
                    </p>
                </div>

                {category.products?.length > 4 && (
                    <div className="hidden md:flex gap-2">
                        <button 
                            onClick={() => scroll(-320)} 
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm"
                        >
                            <FaChevronLeft />
                        </button>
                        <button 
                            onClick={() => scroll(320)} 
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* (Slider Container) */}
            <div className="relative group px-4 md:px-0">
                <div 
                    ref={rowRef}
                    className="flex gap-6 overflow-x-auto pb-4 pt-2 scroll-smooth hide-scrollbar snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                            No products available in this category.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- الشاشة الرئيسية ---
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
            console.error("Error fetching shop data", err);
            setError(err.response?.data?.message || "Failed to load shop categories.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);

    if (loading) {
        return (
            <div className="min-h-screen pt-28 px-4 flex flex-col items-center">
                 <div className="animate-pulse w-full max-w-[1400px]">
                    <div className="h-12 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-12"></div>
                    {[1, 2].map((i) => (
                        <div key={i} className="mb-12">
                            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
                            <div className="flex gap-6 overflow-hidden">
                                {[...Array(4)].map((_, j) => (
                                     <div key={j} className="h-[380px] w-[300px] bg-gray-200 dark:bg-gray-800 rounded-3xl flex-shrink-0"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 transition-colors duration-500">
            <Meta title="Shop Categories | SmartShop" />

            <div className="max-w-[1400px] mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 px-4 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                            <FaStore className="text-primary" /> Shop Collections
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                            Browse products by category
                        </p>
                    </div>
                    {!loading && (
                        <button 
                            onClick={fetchShopData}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition"
                        >
                            <FaSync /> Refresh
                        </button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="max-w-2xl mx-auto text-center py-10 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 mx-4 mb-10">
                        <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Oops! Something went wrong</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                        <button onClick={fetchShopData} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/30">Try Again</button>
                    </div>
                )}

                {/* Categories Loops */}
                {!loading && !error && (
                    <div>
                        {shopData.length > 0 ? (
                            shopData.map((category) => (
                                <CategorySection key={category.id || category._id} category={category} />
                            ))
                        ) : (
                            <div className="text-center py-24 bg-white dark:bg-white/5 rounded-[3rem] shadow-sm mx-4">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                    <FaStore size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Categories Found</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopScreen;