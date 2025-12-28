import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import api from "../api";

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

  const getUserInfo = () => localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")) : null;

  const fetchWishlist = useCallback(async () => {
    const userInfo = getUserInfo();
    if (!userInfo) return;

    dispatch({ type: "WISHLIST_REQUEST" });

    try {
      const { data } = await api.get('api/wishlist/');

      const formattedWishlist = data.map(item => ({
        id: item.product,
        name: item.product_details?.name || "Product Name",
        image: item.product_details?.image || "",
        price: item.product_details?.price || 0,
        discount_price: item.product_details?.discount_price || 0,
        countInStock: item.product_details?.countInStock || 0,
      }));

      dispatch({ type: "WISHLIST_SET_ITEMS", payload: formattedWishlist });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      dispatch({ type: "WISHLIST_FAIL", payload: error.message });
    }
  }, []);
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(async (product) => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      alert("Please login to use wishlist");
      return;
    }

    try {
      // 👇 التعديل هنا: تمت إضافة api/ قبل wishlist
      const { data } = await api.post('api/wishlist/toggle/', {
        product_id: product.id || product._id
      });

      if (data.status === 'added') {
        alert("Added to Wishlist ❤️");
      } else {
        alert("Removed from Wishlist 💔");
      }

      await fetchWishlist();

    } catch (error) {
      console.error(error);
      alert("Error updating wishlist");
    }
  }, [fetchWishlist]);

  const isInWishlist = useCallback((id) => {
    return state.wishlistItems.some((p) => p.id === id);
  }, [state.wishlistItems]);

  const contextValue = useMemo(() => ({
    wishlistItems: state.wishlistItems,
    loading: state.loading,
    error: state.error,
    toggleWishlist,
    isInWishlist,
    fetchWishlist
  }), [state.wishlistItems, state.loading, state.error, toggleWishlist, isInWishlist, fetchWishlist]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  return useContext(WishlistContext);
};