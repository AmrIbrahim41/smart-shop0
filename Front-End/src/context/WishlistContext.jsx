import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import api from "../api";
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const WishlistContext = createContext();

const initialState = {
  wishlistItems: [],
  loading: false,
  error: null
};

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case "WISHLIST_REQUEST":
      return { ...state, loading: true, error: null };

    case "WISHLIST_SET_ITEMS":
      return {
        ...state,
        loading: false,
        wishlistItems: action.payload,
      };

    case "WISHLIST_FAIL":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  const getUserInfo = useCallback(() => {
    try {
      const stored = localStorage.getItem("userInfo");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      // User not logged in, set empty wishlist
      dispatch({ type: "WISHLIST_SET_ITEMS", payload: [] });
      return;
    }

    dispatch({ type: "WISHLIST_REQUEST" });

    try {
      const { data } = await api.get('api/wishlist/');

      // CRITICAL FIX: Check if data is an array
      let wishlistData = [];
      
      if (Array.isArray(data)) {
        wishlistData = data;
      } else if (data && Array.isArray(data.items)) {
        // If backend returns {items: [...]}
        wishlistData = data.items;
      } else if (data && Array.isArray(data.wishlist_items)) {
        // If backend returns {wishlist_items: [...]}
        wishlistData = data.wishlist_items;
      } else {
        console.warn("Unexpected wishlist data structure:", data);
        wishlistData = [];
      }

      const formattedWishlist = wishlistData.map(item => ({
        id: item.product,
        _id: item.product,
        name: item.product_details?.name || "Product Name",
        image: item.product_details?.image || item.product_details?.main_image || "",
        
        // Price with new backend fields
        price: Number(item.product_details?.price || 0),
        discount_price: Number(item.product_details?.discount_price || 0),
        finalPrice: Number(
          item.product_details?.finalPrice || 
          item.product_details?.discount_price || 
          item.product_details?.price || 
          0
        ),
        
        // Stock with backwards compatibility
        count_in_stock: item.product_details?.count_in_stock || item.product_details?.countInStock || 0,
        countInStock: item.product_details?.count_in_stock || item.product_details?.countInStock || 0,
        
        rating: item.product_details?.rating || 0,
        numReviews: item.product_details?.numReviews || 0,
      }));

      dispatch({ type: "WISHLIST_SET_ITEMS", payload: formattedWishlist });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Failed to load wishlist";
      dispatch({ type: "WISHLIST_FAIL", payload: errorMsg });
      
      // Set empty wishlist on error
      dispatch({ type: "WISHLIST_SET_ITEMS", payload: [] });
      
      // Only show toast for actual errors, not for empty wishlist or 404
      if (error.response?.status !== 404 && error.response?.status !== 204) {
        toast.error(errorMsg, { duration: 3000 });
      }
    }
  }, [getUserInfo]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(async (product) => {
    const userInfo = getUserInfo();
    
    if (!userInfo) {
      toast.error("Please login to use wishlist", {
        icon: '🔒',
        duration: 3000,
      });
      return;
    }

    try {
      const { data } = await api.post('api/wishlist/toggle/', {
        product_id: product.id || product._id
      });

      // Custom animated toast
      if (data.status === 'added') {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl pointer-events-auto flex items-center gap-4 p-4 border-2 border-pink-200 dark:border-pink-500/30`}
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="text-2xl"
                >
                  ❤️
                </motion.span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Added to Wishlist
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {product.name}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        ), {
          duration: 2000,
          position: 'top-right',
        });
      } else {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl pointer-events-auto flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700`}
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="text-2xl"
                >
                  💔
                </motion.span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Removed from Wishlist
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {product.name}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        ), {
          duration: 2000,
          position: 'top-right',
        });
      }

      await fetchWishlist();

    } catch (error) {
      console.error("Wishlist toggle error:", error);
      const errorMsg = error.response?.data?.detail || "Error updating wishlist";
      toast.error(errorMsg, { duration: 3000 });
    }
  }, [fetchWishlist, getUserInfo]);

  const isInWishlist = useCallback((id) => {
    return state.wishlistItems.some((p) => (p.id === id || p._id === id));
  }, [state.wishlistItems]);

  const contextValue = useMemo(() => ({
    wishlistItems: state.wishlistItems,
    loading: state.loading,
    error: state.error,
    toggleWishlist,
    isInWishlist,
    fetchWishlist
  }), [
    state.wishlistItems,
    state.loading,
    state.error,
    toggleWishlist,
    isInWishlist,
    fetchWishlist
  ]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
