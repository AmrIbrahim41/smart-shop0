import { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import api from "../api";

const CartContext = createContext();

const initialState = {
  cartItems: [],
  shippingAddress: localStorage.getItem("shippingAddress")
    ? JSON.parse(localStorage.getItem("shippingAddress"))
    : {},
  paymentMethod: localStorage.getItem("paymentMethod")
    ? JSON.parse(localStorage.getItem("paymentMethod"))
    : 'PayPal',
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

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const getUserInfo = () => localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")) : null;

  const fetchCart = useCallback(async () => {
    const userInfo = getUserInfo();
    if (!userInfo) return;

    dispatch({ type: "CART_REQUEST" }); // اختياري: لو عايز تظهر لودينج

    try {
      const { data } = await api.get('cart/');

      const formattedCart = data.map(item => ({
        product: item.product,
        name: item.product_details?.name || "Product",
        image: item.product_details?.image || "",
        price: item.product_details?.discount_price > 0
          ? item.product_details.discount_price
          : item.product_details?.price || 0,
        countInStock: item.product_details?.countInStock || 0,
        qty: item.qty,
        id: item.product
      }));

      dispatch({ type: "CART_SET_ITEMS", payload: formattedCart });
    } catch (error) {
      console.error("Error fetching cart:", error);
      dispatch({ type: "CART_FAIL", payload: error.message });
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 2. add product
  const addToCart = useCallback(async (product, qty) => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      const productId = product.id || product._id;

      await api.post('cart/add/', {
        product_id: productId,
        qty: qty
      });

      await fetchCart();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item to cart");
    }
  }, [fetchCart]);

  // 3. delete (API)
  const removeFromCart = useCallback(async (id) => {
    try {
      await api.delete(`cart/remove/${id}/`);
      await fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }, [fetchCart]);

  // 4. clear (API)
  const clearCart = useCallback(async () => {
    try {
      await api.delete('cart/clear/');
      dispatch({ type: "CART_CLEAR_LOCALS" });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  }, []);

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
  return useContext(CartContext);
};