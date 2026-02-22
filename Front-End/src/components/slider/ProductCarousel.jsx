import React, { useEffect, useState, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api, { ENDPOINTS, getImageUrl } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCarousel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch top products
    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data } = await api.get(ENDPOINTS.TOP_PRODUCTS);
                
                // Handle new backend response format (might be array or object)
                const productArray = Array.isArray(data) ? data : data.products || [];
                
                if (productArray.length === 0) {
                    setError('No featured products available');
                    setProducts([]);
                } else {
                    setProducts(productArray.slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching top products:", error);
                const errorMessage = error.response?.data?.detail || 'Failed to load featured products';
                setError(errorMessage);
                toast.error(errorMessage, { duration: 3000 });
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, []);

    // Auto-rotation - FIXED: Removed currentIndex from dependencies
    useEffect(() => {
        if (products.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === products.length - 1 ? 0 : prevIndex + 1
            );
        }, 7000);

        return () => clearInterval(interval);
    }, [products.length]); // Only depends on products.length

    // Manual navigation
    const goToNext = useCallback(() => {
        setCurrentIndex((prevIndex) => 
            prevIndex === products.length - 1 ? 0 : prevIndex + 1
        );
    }, [products.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? products.length - 1 : prevIndex - 1
        );
    }, [products.length]);

    const goToSlide = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    // Loading State
    if (loading) {
        return (
            <div className="w-full h-[400px] md:h-[550px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-[2.5rem] animate-pulse mb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <div className="absolute bottom-8 left-8 space-y-4">
                    <div className="w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="w-64 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-48 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || products.length === 0) {
        return (
            <div className="w-full h-[400px] md:h-[550px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[2.5rem] mb-16 flex items-center justify-center">
                <div className="text-center px-6">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        No Featured Products
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Check back soon for amazing deals!
                    </p>
                </div>
            </div>
        );
    }

    const product = products[currentIndex];
    if (!product) return null;

    const productId = product.id;
    const finalPrice = product.finalPrice || product.discount_price || product.price;

    return (
        <div className="relative w-full max-w-7xl mx-auto h-[400px] md:h-[550px] rounded-[2.5rem] overflow-hidden mb-16 bg-black shadow-2xl group">
            {/* Background Image with Animation */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={productId}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        className="w-full h-full object-cover opacity-50"
                        onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrevious}
                aria-label="Previous product"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <FaChevronLeft size={20} />
            </button>

            <button
                onClick={goToNext}
                aria-label="Next product"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <FaChevronRight size={20} />
            </button>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 z-20">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={productId}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-3xl"
                    >
                        {/* Badges */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <motion.span
                                initial={{ scale: 0, rotate: -12 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-primary/40"
                            >
                                Featured
                            </motion.span>
                            {/* تم التعديل هنا: تحويل التقييم إلى رقم قبل استخدام toFixed */}
                            {Number(product.rating) > 0 && (
                                <div className="flex items-center gap-1.5 text-yellow-400 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg">
                                    <FaStar size={14} />
                                    <span className="text-white font-bold text-sm">
                                        {Number(product.rating).toFixed(1)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <Link to={`/product/${productId}`} className="group/link block">
                            <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-4 leading-tight tracking-tight group-hover/link:text-primary transition-colors duration-300 line-clamp-2">
                                {product.name}
                            </h2>
                        </Link>

                        {/* Description */}
                        {product.description && (
                            <p className="text-gray-200 text-sm md:text-lg mb-6 md:mb-8 line-clamp-2 hidden md:block font-medium max-w-xl drop-shadow-lg">
                                {product.description}
                            </p>
                        )}

                        {/* Price & CTA */}
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <div className="flex items-baseline gap-3">
                                {/* تم التعديل هنا لتجنب مشاكل مشابهة مع السعر */}
                                <span className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                    ${Number(finalPrice).toFixed(2)}
                                </span>
                                {product.discount_price && Number(product.discount_price) < Number(product.price) && (
                                    <span className="text-lg md:text-2xl text-gray-400 line-through font-bold">
                                        ${Number(product.price).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            
                            <Link
                                to={`/product/${productId}`}
                                className="flex items-center gap-2 md:gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-primary hover:text-white transition-all group/btn shadow-lg shadow-white/10 active:scale-95"
                            >
                                Shop Now
                                <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs md:text-base" />
                            </Link>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 flex gap-2 md:gap-3 z-20">
                {products.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === currentIndex ? 'true' : 'false'}
                        className={`h-1.5 rounded-full transition-all duration-500 backdrop-blur-sm ${
                            index === currentIndex
                                ? 'bg-primary w-8 shadow-lg shadow-primary/50'
                                : 'bg-white/40 w-3 hover:bg-white hover:w-5'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(ProductCarousel);