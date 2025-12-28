import React, { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaStar } from 'react-icons/fa';
import api, { ENDPOINTS, getImageUrl } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCarousel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const { data } = await api.get(ENDPOINTS.TOP_PRODUCTS);
                setProducts(data.slice(0, 5));
                setLoading(false);
            } catch (error) {
                console.error("Error fetching top products:", error);
                setLoading(false);
            }
        };
        fetchTopProducts();
    }, []);

    useEffect(() => {
        if (products.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
        }, 7000);

        return () => clearInterval(interval);
    }, [products.length, currentIndex]);

    if (loading) {
        // Skeleton Loading
        return <div className="w-full h-[400px] md:h-[550px] bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse mb-12"></div>;
    }

    if (products.length === 0) {
        return null;
    }

    const product = products[currentIndex];

    if (!product) return null;

    const productId = product.id || product._id;

    return (
        <div className="relative w-full max-w-7xl mx-auto h-[400px] md:h-[550px] rounded-[2.5rem] overflow-hidden mb-16 bg-black shadow-2xl">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={productId}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-3xl"
                    >
                        {/* stars*/}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-primary/30">
                                Featured
                            </span>
                            <div className="flex items-center gap-1 text-yellow-400 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg">
                                <FaStar size={14} />
                                <span className="text-white font-bold text-sm">{product.rating || 0}</span>
                            </div>
                        </div>

                        {/* title */}
                        <Link to={`/product/${productId}`} className="group block">
                            <h2 className="text-3xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
                                {product.name}
                            </h2>
                        </Link>

                        {/* dis */}
                        <p className="text-gray-200 text-base md:text-lg mb-8 line-clamp-2 hidden md:block font-medium max-w-xl drop-shadow-md">
                            {product.description}
                        </p>

                        {/* shop now*/}
                        <div className="flex flex-wrap items-center gap-6">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                ${product.price}
                            </span>
                            <Link
                                to={`/product/${productId}`}
                                className="flex items-center gap-2 md:gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-primary hover:text-white transition-all group shadow-lg shadow-white/10 active:scale-95"
                            >
                                Shop Now
                                <FaArrowRight className="group-hover:translate-x-1 transition-transform text-xs md:text-base" />
                            </Link>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* (Dots) */}
            <div className="absolute bottom-8 right-8 flex gap-3 z-20">
                {products.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-500 backdrop-blur-sm ${index === currentIndex
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