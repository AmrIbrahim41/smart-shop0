import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaCheck, FaTrash, FaShoppingBag } from 'react-icons/fa';
import { getImageUrl } from '../../api';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCard = memo(({ product }) => {
    const { addToCart, removeFromCart, cartItems } = useCart();

    const productId = product.id || product._id;
    const stockCount = product.count_in_stock !== undefined ? product.count_in_stock : product.countinstock;
    const isOutOfStock = stockCount === 0;

    const isInCart = cartItems.some((item) => {
        const itemId = item.product || item.id || item._id;
        return itemId === productId;
    });

    const handleCartAction = useCallback((e) => {
        e.preventDefault();
        if (isOutOfStock) return;

        if (isInCart) {
            removeFromCart(productId);
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-gray-800 border-l-4 border-red-500 shadow-2xl p-4 rounded-r-xl flex items-center gap-3 min-w-[300px] z-50"
                >
                    <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-full text-red-500">
                        <FaTrash />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">Removed</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{product.name}</p>
                    </div>
                </motion.div>
            ), { duration: 1500 });

        } else {
            addToCart(product, 1);
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 min-w-[300px] justify-between z-50"
                >
                    <div className="flex items-center gap-3">
                        <FaCheck className="text-green-400" />
                        <div>
                            <p className="font-bold text-sm">Added to Bag</p>
                            <p className="text-[10px] opacity-70 line-clamp-1">{product.name}</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-1.5 rounded-full"><FaShoppingBag size={12} /></div>
                </motion.div>
            ), { duration: 2000 });
        }
    }, [isOutOfStock, isInCart, productId, product, removeFromCart, addToCart]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="group relative flex flex-col w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-500 border border-gray-100 dark:border-white/5"
        >

            {/* 1. main img*/}
            <div className="relative w-full aspect-[3/4] rounded-t-[2rem] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Link to={`/product/${productId}`} className="block w-full h-full">
                    <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-all duration-700 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                        // Fallback للصورة لو الرابط مكسور
                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                    />
                </Link>

                {/* status*/}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {product.discount_price > 0 && !isOutOfStock && (
                        <span className="bg-white/90 dark:bg-black/90 backdrop-blur text-red-600 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm uppercase tracking-wider">
                            Sale
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="bg-black/90 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm uppercase tracking-wider">
                            Sold Out
                        </span>
                    )}
                </div>
            </div>

            {/* 2. details*/}
            <div className="relative p-5 pt-8">

                {/* flaoting but*/}
                <div className="absolute -top-7 right-5 z-20">
                    <motion.button
                        onClick={handleCartAction}
                        disabled={isOutOfStock}
                        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all border-4 border-white dark:border-gray-900 ${isOutOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isInCart
                                ? 'bg-gradient-to-tr from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black shadow-black/20'
                                : 'bg-gradient-to-tr from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black shadow-black/20'
                            }`}
                    >
                        <AnimatePresence mode='wait'>
                            {isInCart ? (
                                <motion.div key="trash" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 45 }}>
                                    <FaTrash size={16} className={isInCart ? "text-red-500" : ""} />
                                </motion.div>
                            ) : (
                                <motion.div key="bag" initial={{ scale: 0, y: 5 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: -5 }}>
                                    <FaShoppingBag size={18} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/*text*/}
                <Link to={`/product/${productId}`} className="block group-hover:text-primary transition-colors duration-300">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1 mb-2">
                        {product.name}
                    </h3>
                </Link>

                <div className="flex items-center justify-between">
                    {/* price*/}
                    <div className="flex items-baseline gap-2">
                        {product.discount_price > 0 ? (
                            <>
                                <span className="font-black text-2xl text-gray-900 dark:text-white">${product.discount_price}</span>
                                <span className="text-sm text-gray-400 line-through font-medium">${product.price}</span>
                            </>
                        ) : (
                            <span className="font-black text-2xl text-gray-900 dark:text-white">${product.price}</span>
                        )}
                    </div>

                    {/* stars */}
                    <div className="flex items-center gap-1.5 opacity-60">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{product.rating || '4.5'}</span>
                    </div>
                </div>
            </div>

        </motion.div>
    );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;