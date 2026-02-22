import React, { useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaArrowRight,
  FaShoppingBag,
  FaSync,
  FaTruck,
  FaTag,
  FaSpinner,
} from "react-icons/fa";
import Meta from "../../components/tapheader/Meta";
import { useSettings } from "../../context/SettingsContext";
import { useStoreSettings } from "../../context//Storesettingscontext";
import api, { getImageUrl } from "../../api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CartScreen = () => {
  const { cartItems, removeFromCart, fetchCart } = useCart();
  const navigate = useNavigate();
  const { t } = useSettings();

  // ── Live store settings from the backend ──────────────────────────────────
  const {
    taxRate: TAX_RATE,
    shippingCost: SHIPPING_COST,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    loading: settingsLoading,
  } = useStoreSettings();

  const [updatingId, setUpdatingId] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns the effective unit price honouring discount_price */
  const getEffectivePrice = useCallback((item) => {
    if (item.final_price) return Number(item.final_price);
    const price = Number(item.price);
    const discount = Number(item.discount_price || 0);
    return discount > 0 && discount < price ? discount : price;
  }, []);

  // ── Cart totals ───────────────────────────────────────────────────────────

  const { subtotal, tax, shipping, total, itemCount } = useMemo(() => {
    const sub = cartItems.reduce(
      (acc, item) => acc + item.qty * getEffectivePrice(item),
      0
    );
    const taxVal = sub * TAX_RATE;
    const ship = sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const tot = sub + taxVal + ship;
    const count = cartItems.reduce((acc, item) => acc + item.qty, 0);
    return { subtotal: sub, tax: taxVal, shipping: ship, total: tot, itemCount: count };
  }, [cartItems, getEffectivePrice, TAX_RATE, SHIPPING_COST, FREE_SHIPPING_THRESHOLD]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const checkoutHandler = () => {
    if (!localStorage.getItem("userInfo")) {
      toast.error("Please login to proceed", { icon: "🔒" });
      navigate("/login?redirect=shipping");
    } else {
      navigate("/shipping");
    }
  };

  const handleQtyChange = useCallback(
    async (item, newQty) => {
      const productId = item.product || item.id || item._id;
      const maxStock = item.count_in_stock || item.countInStock || 0;

      if (newQty < 1) {
        toast.error("Quantity must be at least 1");
        return;
      }
      if (newQty > maxStock) {
        toast.error(`Only ${maxStock} items in stock`);
        return;
      }
      if (updatingId === productId) return;

      try {
        setUpdatingId(productId);
        await api.put("api/cart/update/", { product_id: productId, qty: newQty });
        await fetchCart();
        toast.success("Cart updated", { duration: 1500, icon: "✅" });
      } catch (error) {
        console.error("Failed to update cart:", error);
        toast.error(error.response?.data?.detail || "Failed to update quantity");
      } finally {
        setUpdatingId(null);
      }
    },
    [updatingId, fetchCart]
  );

  // ── Empty cart ─────────────────────────────────────────────────────────────

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-10 px-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center transition-colors duration-500">
        <Meta title={t("shoppingCart") || "Shopping Cart"} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 max-w-lg w-full"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 dark:text-gray-500 text-4xl"
          >
            <FaShoppingBag />
          </motion.div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {t("cartEmpty") || "Your Cart is Empty"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Start adding items to get shopping!
          </p>
          <Link
            to="/"
            className="inline-block w-full bg-primary hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition shadow-lg uppercase tracking-wide transform hover:scale-105"
          >
            {t("startShopping") || "START SHOPPING"}
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Full cart ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta
        title={`${t("shoppingCart") || "Shopping Cart"} (${itemCount}) | SmartShop`}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <FaShoppingBag className="text-primary" />
            {t("shoppingCart") || "Shopping Cart"}
            <span className="text-lg text-gray-400 font-medium">
              ({itemCount} items)
            </span>
          </h1>
          <button
            onClick={fetchCart}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <FaSync className="text-xs" /> Refresh Cart
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => {
                const currentId = item.product || item.id || item._id;
                const isUpdating = updatingId === currentId;
                const effectivePrice = getEffectivePrice(item);
                const hasDiscount = effectivePrice < Number(item.price);
                const maxStock = item.count_in_stock || item.countInStock || 0;

                return (
                  <motion.div
                    key={currentId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="relative bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Loading overlay */}
                    {isUpdating && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 z-10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                        <FaSync className="animate-spin text-primary text-3xl" />
                      </div>
                    )}

                    {/* Image */}
                    <Link
                      to={`/product/${currentId}`}
                      className="w-full sm:w-32 h-32 bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-3 group"
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-500"
                        onError={(e) => {
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 text-center sm:text-left w-full">
                      <Link
                        to={`/product/${currentId}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition line-clamp-2 mb-2 block"
                      >
                        {item.name}
                      </Link>

                      {/* Price */}
                      <div className="mb-4 flex flex-col sm:items-start items-center">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-black text-2xl">
                              ${effectivePrice.toFixed(2)}
                            </span>
                            <span className="text-gray-400 line-through text-sm font-bold">
                              ${Number(item.price).toFixed(2)}
                            </span>
                            <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black px-2 py-1 rounded-lg">
                              SAVE{" "}
                              {Math.round(
                                ((Number(item.price) - effectivePrice) /
                                  Number(item.price)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        ) : (
                          <span className="text-primary font-black text-2xl">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                          Subtotal:{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            ${(effectivePrice * item.qty).toFixed(2)}
                          </span>
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                          <button
                            disabled={item.qty <= 1 || isUpdating}
                            onClick={() => handleQtyChange(item, item.qty - 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-white font-bold"
                            aria-label="Decrease quantity"
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="w-12 text-center font-bold text-gray-900 dark:text-white select-none text-lg">
                            {item.qty}
                          </span>
                          <button
                            disabled={item.qty >= maxStock || isUpdating}
                            onClick={() => handleQtyChange(item, item.qty + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-white font-bold"
                            aria-label="Increase quantity"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>

                        {maxStock <= 5 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                            Only {maxStock} left!
                          </span>
                        )}

                        <button
                          onClick={() => removeFromCart(currentId)}
                          disabled={isUpdating}
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-50"
                          title={t("remove") || "Remove"}
                          aria-label="Remove from cart"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-[420px]">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 sticky top-24 shadow-2xl">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-4 flex items-center gap-2">
                <FaTag className="text-primary" />
                {t("orderSummary") || "Order Summary"}
              </h3>

              {/* Settings loading indicator */}
              {settingsLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <FaSpinner className="animate-spin" />
                  Loading rates…
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <span>Items ({itemCount})</span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <span>
                    {t("tax") || "Tax"} ({(TAX_RATE * 100).toFixed(0)}%)
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <FaTruck className="text-sm" />
                    <span>{t("shipping") || "Shipping"}</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-bold">
                    {shipping === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-black">
                        FREE
                      </span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {subtotal < FREE_SHIPPING_THRESHOLD && shipping > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                      💡 Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}{" "}
                      more for FREE shipping!
                    </p>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white font-black text-lg uppercase">
                      {t("total") || "TOTAL"}
                    </span>
                    <span className="text-primary font-black text-3xl">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkoutHandler}
                className="w-full bg-gradient-to-r from-primary to-orange-600 hover:shadow-lg hover:shadow-primary/30 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-3 transition-all uppercase tracking-wide group"
              >
                {t("proceedCheckout") || "PROCEED TO CHECKOUT"}
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <Link
                to="/"
                className="block text-center text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-bold mt-4 transition"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
