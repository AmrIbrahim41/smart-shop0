import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import api from "../api";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CartContext = createContext();

const initialState = {
  cartItems: [],
  shippingAddress: (() => {
    try {
      const stored = localStorage.getItem("shippingAddress");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })(),
  paymentMethod: (() => {
    try {
      const stored = localStorage.getItem("paymentMethod");
      return stored ? JSON.parse(stored) : 'PayPal';
    } catch {
      return 'PayPal';
    }
  })(),
  loading: false,
  error: null,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "CART_REQUEST":
      return { ...state, loading: true, error: null };

    case "CART_SET_ITEMS":
      return {
        ...state,
        loading: false,
        cartItems: action.payload,
      };

    case "CART_FAIL":
      return { ...state, loading: false, error: action.payload };

    case "CART_SAVE_SHIPPING_ADDRESS":
      return {
        ...state,
        shippingAddress: action.payload,
      };

    case "CART_SAVE_PAYMENT_METHOD":
      return {
        ...state,
        paymentMethod: action.payload,
      };

    case "CART_CLEAR_LOCALS":
      return {
        ...state,
        cartItems: [],
        shippingAddress: {},
        paymentMethod: 'PayPal'
      };

    default:
      return state;
  }
};

// Reusable Animated Toast Component
const CustomToast = ({ t, icon, title, message, bgIconColor }) => (
  <AnimatePresence>
    {t.visible && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl pointer-events-auto flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full ${bgIconColor} flex items-center justify-center`}>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="text-2xl"
            >
              {icon}
            </motion.span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </p>
          {message && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const getUserInfo = useCallback(() => {
    try {
      const stored = localStorage.getItem("userInfo");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchCart = useCallback(async () => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      dispatch({ type: "CART_SET_ITEMS", payload: [] });
      return;
    }

    dispatch({ type: "CART_REQUEST" });

    try {
      // FIX: Added 'api/' prefix to resolve 404
      const { data } = await api.get('api/cart/');

      let cartData = [];
      if (Array.isArray(data)) {
        cartData = data;
      } else if (data && Array.isArray(data.items)) {
        cartData = data.items;
      } else if (data && Array.isArray(data.cart_items)) {
        cartData = data.cart_items;
      }

      const formattedCart = cartData.map(item => ({
        id: item.product,
        product: item.product,
        name: item.product_details?.name || "Product",
        image: item.product_details?.image || "",
        
        // Strict snake_case mapping based on serializers.py
        price: Number(item.product_details?.price || 0),
        discount_price: Number(item.product_details?.discount_price || 0),
        final_price: Number(item.product_details?.final_price || item.product_details?.price || 0),
        count_in_stock: Number(item.product_details?.count_in_stock || 0),
        
        qty: item.qty || 1,
      }));

      dispatch({ type: "CART_SET_ITEMS", payload: formattedCart });
    } catch (error) {
      console.error("Error fetching cart:", error);
      const errorMsg = error.response?.data?.detail || "Failed to load cart";
      dispatch({ type: "CART_FAIL", payload: errorMsg });
      dispatch({ type: "CART_SET_ITEMS", payload: [] });
      
      if (error.response?.status !== 404 && error.response?.status !== 204) {
        toast.error(errorMsg);
      }
    }
  }, [getUserInfo]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, qty) => {
    const userInfo = getUserInfo();
    
    if (!userInfo) {
      toast.error("Please login to add items to cart", { icon: '🔒' });
      return;
    }

    try {
      // FIX: Added 'api/' prefix
      await api.post('api/cart/add/', {
        product_id: product.id || product.product,
        qty: qty
      });

      toast.custom((t) => (
        <CustomToast 
          t={t} 
          icon="🛒" 
          title="Added to Cart" 
          message={`${product.name} (x${qty})`}
          bgIconColor="bg-blue-100 dark:bg-blue-900/30" 
        />
      ), { duration: 3000, position: 'bottom-right' });

      await fetchCart();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(error.response?.data?.detail || "Error adding item to cart");
    }
  }, [fetchCart, getUserInfo]);

  const removeFromCart = useCallback(async (id) => {
    try {
      // FIX: Added 'api/' prefix
      await api.delete(`api/cart/remove/${id}/`);
      
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          icon="🗑️" 
          title="Removed from Cart" 
          bgIconColor="bg-red-100 dark:bg-red-900/30" 
        />
      ), { duration: 2000, position: 'bottom-right' });
      
      await fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.detail || "Error removing item");
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      const userInfo = getUserInfo();
      if (userInfo) {
        // FIX: Added 'api/' prefix
        await api.delete('api/cart/clear/');
      }
      dispatch({ type: "CART_CLEAR_LOCALS" });
      
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          icon="🧹" 
          title="Cart Cleared" 
          bgIconColor="bg-gray-100 dark:bg-gray-700" 
        />
      ), { duration: 2000, position: 'bottom-right' });
    } catch (error) {
      console.error("Error clearing cart:", error);
      dispatch({ type: "CART_CLEAR_LOCALS" });
    }
  }, [getUserInfo]);

  const saveShippingAddress = useCallback((data) => {
    dispatch({ type: "CART_SAVE_SHIPPING_ADDRESS", payload: data });
    localStorage.setItem("shippingAddress", JSON.stringify(data));
  }, []);

  const savePaymentMethod = useCallback((data) => {
    dispatch({ type: "CART_SAVE_PAYMENT_METHOD", payload: data });
    localStorage.setItem("paymentMethod", JSON.stringify(data));
  }, []);

  const contextValue = useMemo(() => ({
    cartItems: state.cartItems,
    shippingAddress: state.shippingAddress,
    paymentMethod: state.paymentMethod,
    loading: state.loading,
    error: state.error,
    addToCart,
    removeFromCart,
    clearCart,
    saveShippingAddress,
    savePaymentMethod,
    fetchCart
  }), [state, addToCart, removeFromCart, clearCart, saveShippingAddress, savePaymentMethod, fetchCart]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};