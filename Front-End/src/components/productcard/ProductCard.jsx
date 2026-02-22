import React, { memo, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaCheck, FaTrash, FaShoppingBag, FaHeart } from 'react-icons/fa';
import { getImageUrl } from '../../api';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCard = memo(({ product }) => {
    const { addToCart, removeFromCart, cartItems } = useCart();
    const navigate = useNavigate();

    // Extract product data with new backend field names
    const productData = useMemo(() => ({
        id: product.id,
        name: product.name,
        image: product.image,
        price: Number(product.price) || 0,
        discountPrice: Number(product.discount_price) || 0,
        finalPrice: Number(product.finalPrice || product.discount_price || product.price) || 0,
        rating: Number(product.rating) || 0, // هنا ضفنا Number() عشان نحوله لرقم
        stockCount: product.countInStock || product.count_in_stock || 0,
        isActive: product.isActive !== undefined ? product.isActive : product.is_active !== false,
    }), [product]);

    const isOutOfStock = productData.stockCount === 0 || !productData.isActive;
    const hasDiscount = productData.discountPrice > 0 && productData.discountPrice < productData.price;

    // Check if product is in cart
    const isInCart = useMemo(() => {
        return cartItems.some((item) => {
            const itemId = item.product || item.id;
            return itemId === productData.id;
        });
    }, [cartItems, productData.id]);

    // Handle add/remove from cart
    const handleCartAction = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const userInfo = localStorage.getItem('userInfo');

        if (!userInfo) {
            toast.error('Please login to add items to cart', {
                icon: '🔒',
                duration: 3000,
                style: {
                    borderRadius: '12px',
                    background: '#333',
                    color: '#fff',
                },
            });
            navigate('/login', { state: { from: `/product/${productData.id}` } });
            return;
        }

        if (isOutOfStock) {
            toast.error('This product is currently out of stock', {
                icon: '❌',
                duration: 2000,
            });
            return;
        }

        if (isInCart) {
            removeFromCart(productData.id);
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: t.visible ? 1 : 0, x: t.visible ? 0 : 20 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-gray-800 border-l-4 border-red-500 shadow-2xl p-4 rounded-r-xl flex items-center gap-3 min-w-[280px] max-w-md"
                >
                    <div className="bg-red-50 dark:bg-red-500/10 p-2.5 rounded-full text-red-500">
                        <FaTrash size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Removed from Cart</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{productData.name}</p>
                    </div>
                </motion.div>
            ), { duration: 2000, position: 'top-right' });
        } else {
            addToCart(product, 1);
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : 50, scale: t.visible ? 1 : 0.8 }}
                    exit={{ opacity: 0, y: 50, scale: 0.8 }}
                    className="bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-100 text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px] max-w-md"
                >
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-green-500 p-2 rounded-full">
                            <FaCheck size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Added to Cart!</p>
                            <p className="text-[10px] opacity-70 line-clamp-1">{productData.name}</p>
                        </div>
                    </div>
                    <div className="bg-white/20 dark:bg-black/20 p-2 rounded-full">
                        <FaShoppingBag size={14} />
                    </div>
                </motion.div>
            ), { duration: 3000, position: 'top-right' });
        }
    }, [isOutOfStock, isInCart, productData, removeFromCart, addToCart, navigate, product]);

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="group relative flex flex-col w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-500 border border-gray-100 dark:border-white/5 overflow-hidden"
        >
            {/* Product Image */}
            <div className="relative w-full aspect-[3/4] rounded-t-[2rem] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Link 
                    to={`/product/${productData.id}`} 
                    className="block w-full h-full"
                    aria-label={`View details for ${productData.name}`}
                >
                    <motion.img
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        src={getImageUrl(productData.image)}
                        alt={productData.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-all duration-700 ${
                            isOutOfStock ? 'grayscale opacity-50' : ''
                        }`}
                        onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                        }}
                    />
                </Link>

                {/* Status Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {hasDiscount && !isOutOfStock && (
                        <motion.span
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-gradient-to-r from-red-500 to-red-600 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider"
                        >
                            {Math.round(((productData.price - productData.discountPrice) / productData.price) * 100)}% OFF
                        </motion.span>
                    )}
                    {isOutOfStock && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-black/90 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider"
                        >
                            Sold Out
                        </motion.span>
                    )}
                </div>

                {/* Quick Actions Overlay (Desktop) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/20 backdrop-blur-[2px] hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <Link
                        to={`/product/${productData.id}`}
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-xl transform hover:scale-105"
                    >
                        View Details
                    </Link>
                </motion.div>
            </div>

            {/* Product Details */}
            <div className="relative p-5 pt-8 flex-1 flex flex-col">
                {/* Floating Cart Button */}
                <div className="absolute -top-7 right-5 z-20">
                    <motion.button
                        onClick={handleCartAction}
                        disabled={isOutOfStock}
                        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: isOutOfStock ? 1 : 1.1, y: isOutOfStock ? 0 : -2 }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all border-4 border-white dark:border-gray-900 ${
                            isOutOfStock
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-tr from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black shadow-black/20 hover:shadow-2xl'
                        }`}
                    >
                        <AnimatePresence mode='wait'>
                            {isInCart ? (
                                <motion.div
                                    key="trash"
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 45 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FaTrash size={16} className="text-red-500" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="bag"
                                    initial={{ scale: 0, y: 5 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FaShoppingBag size={18} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Product Name */}
                <Link
                    to={`/product/${productData.id}`}
                    className="block group-hover:text-primary transition-colors duration-300 mb-3"
                >
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
                        {productData.name}
                    </h3>
                </Link>

                {/* Price & Rating */}
                <div className="flex items-end justify-between mt-auto">
                    {/* Price */}
                    <div className="flex flex-col">
                        {hasDiscount ? (
                            <>
                                <span className="font-black text-2xl text-gray-900 dark:text-white">
                                    ${productData.discountPrice}
                                </span>
                                <span className="text-sm text-gray-400 line-through font-medium">
                                    ${productData.price}
                                </span>
                            </>
                        ) : (
                            <span className="font-black text-2xl text-gray-900 dark:text-white">
                                ${productData.price}
                            </span>
                        )}
                    </div>

                    {/* Rating */}
                    {productData.rating > 0 && (
                        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1.5 rounded-lg">
                            <FaStar className="text-yellow-500 text-xs" />
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {productData.rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stock Indicator */}
                {!isOutOfStock && productData.stockCount <= 5 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                            Only {productData.stockCount} left in stock!
                        </p>
                    </div>
                )}
            </div>
        </motion.article>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;