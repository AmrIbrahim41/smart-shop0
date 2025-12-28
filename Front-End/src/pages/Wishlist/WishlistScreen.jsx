import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/productcard/ProductCard'; 
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { FaHeartBroken, FaHeart } from 'react-icons/fa';

const WishlistScreen = () => {
    const { wishlistItems, fetchWishlist } = useWishlist();
    const { t } = useSettings();

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    return (
        <div className="min-h-screen pt-28 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 pb-10 transition-colors duration-500">
            <Meta title={t('myWishlist') || "My Wishlist"} />
            
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex items-center gap-3 mb-10 animate-fade-in-up">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-2xl">
                        <FaHeart className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            {t('myWishlist') || "MY WISHLIST"}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {wishlistItems.length} {t('itemsSaved') || "Items Saved"}
                        </p>
                    </div>
                </div>
                
                {/* Content Section */}
                {wishlistItems.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center text-center mt-10 bg-white dark:bg-gray-800 p-12 rounded-[2.5rem] border border-dashed border-gray-300 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md max-w-2xl mx-auto animate-fade-in">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6 text-gray-400 dark:text-gray-500">
                            <FaHeartBroken className="text-5xl" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">
                            {t('wishlistEmpty') || "Your wishlist is empty"}
                        </h2>
                        <p className="mb-8 text-gray-500 dark:text-gray-400 max-w-md">
                            {t('startExploring') || "Seems like you don't have wishes here. Make a wish!"}
                        </p>
                        <Link 
                            to="/" 
                            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-primary/30 uppercase tracking-wide transform hover:-translate-y-1"
                        >
                            {t('goShopping') || "EXPLORE PRODUCTS"}
                        </Link>
                    </div>
                ) : (
                    // Products Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20 animate-fade-in-up">
                        {wishlistItems.map((product) => (
                            <div key={product.id || product._id} className="h-full">
                               <ProductCard product={product} /> 
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistScreen;