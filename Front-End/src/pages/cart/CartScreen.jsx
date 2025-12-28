import React, { useMemo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FaTrash, FaMinus, FaPlus, FaArrowRight, FaShoppingBag, FaSync } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import api, { getImageUrl } from '../../api'; 
import toast from 'react-hot-toast'; 

const TAX_RATE = 0.05;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 10;

const CartScreen = () => {
  const { cartItems, removeFromCart, fetchCart } = useCart(); 
  const navigate = useNavigate();
  const { t } = useSettings();

  const [updatingId, setUpdatingId] = useState(null);

  // --- دالة مساعدة لحساب السعر الفعلي (هل نستخدم الخصم أم السعر الأصلي؟) ---
  const getEffectivePrice = (item) => {
      // نتأكد من تحويل القيم لأرقام لتجنب الأخطاء
      // نتحقق من discount_price (كما يأتي من الباك إند) أو discountPrice
      const price = Number(item.price);
      const discount = Number(item.discount_price || item.discountPrice || 0);
      
      // نستخدم الخصم فقط إذا كان أكبر من صفر وأقل من السعر الأصلي
      if (discount > 0 && discount < price) {
          return discount;
      }
      return price;
  };

  // --- 1. Performance: الحسابات تعتمد الآن على getEffectivePrice ---
  const { subtotal, tax, shipping, total } = useMemo(() => {
    // التعديل هنا: ضرب الكمية في "السعر الفعلي" بدلاً من السعر الثابت
    const sub = cartItems.reduce((acc, item) => acc + item.qty * getEffectivePrice(item), 0);
    
    const taxVal = sub * TAX_RATE;
    const ship = sub > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const tot = sub + taxVal + ship;
    
    return { subtotal: sub, tax: taxVal, shipping: ship, total: tot };
  }, [cartItems]);

  const checkoutHandler = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login?redirect=shipping');
    } else {
      navigate('/shipping');
    }
  };

  // --- 2. Logic: دالة تحديث الكمية ---
  const handleQtyChange = useCallback(async (item, newQty) => {
      const productId = item.product || item.id || item._id;
      
      if (newQty < 1 || newQty > item.countInStock || updatingId === productId) return;

      try {
          setUpdatingId(productId); 
          
          await api.put('/cart/update/', { 
              product_id: productId, 
              qty: newQty 
          });
          
          if (fetchCart) {
              await fetchCart(); 
          } else {
               window.location.reload(); 
          }
          
          toast.success("Cart Updated", { duration: 1000, icon: '🛒' });

      } catch (error) {
          console.error("Failed to update cart:", error);
          toast.error(error.response?.data?.detail || "Failed to update quantity");
      } finally {
          setUpdatingId(null); 
      }
  }, [updatingId, fetchCart]);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-10 px-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center transition-colors duration-500">
        <Meta title={t('shoppingCart') || "Shopping Cart"} />
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 max-w-lg w-full animate-fade-in-up">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 dark:text-gray-500 text-4xl animate-bounce-slow">
                <FaShoppingBag />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('cartEmpty') || "Your Cart is Empty"}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/" className="inline-block w-full bg-primary hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition shadow-lg uppercase tracking-wide transform hover:scale-105">
                {t('startShopping') || "START SHOPPING"}
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta title={t('shoppingCart') || "Shopping Cart"} />
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
          <FaShoppingBag className="text-primary" /> {t('shoppingCart') || "Shopping Cart"}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Cart Items List */}
          <div className="flex-1 space-y-6">
            {cartItems.map((item) => {
              const currentId = item.product || item.id || item._id;
              const isUpdating = updatingId === currentId;

              // حساب القيم للعرض
              const effectivePrice = getEffectivePrice(item);
              const hasDiscount = effectivePrice < Number(item.price);

              return (
                <div key={currentId} className="relative bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300">
                  
                  {isUpdating && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                        <FaSync className="animate-spin text-primary text-2xl" />
                    </div>
                  )}

                  <div className="w-full sm:w-32 h-32 bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 relative group">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      loading="lazy" 
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-500"
                      onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left w-full">
                    <Link to={`/product/${currentId}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition line-clamp-1 mb-1">
                      {item.name}
                    </Link>

                    {/* --- التعديل في العرض هنا --- */}
                    <div className="mb-4 flex flex-col sm:items-start items-center">
                        {hasDiscount ? (
                            <>
                                <span className="text-gray-400 line-through text-sm font-bold">${item.price}</span>
                                <span className="text-primary font-black text-xl">${effectivePrice}</span>
                            </>
                        ) : (
                            <span className="text-primary font-black text-xl">${item.price}</span>
                        )}
                    </div>
                    {/* --------------------------- */}
                    
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                          <button
                              disabled={item.qty <= 1 || isUpdating} 
                              onClick={() => handleQtyChange(item, item.qty - 1)}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-white"
                          >
                              <FaMinus size={12} />
                          </button>
                          
                          <span className="w-12 text-center font-bold text-gray-900 dark:text-white select-none text-lg">
                            {item.qty}
                          </span>
                          
                          <button
                              disabled={item.qty >= item.countInStock || isUpdating} 
                              onClick={() => {
                                  if (item.qty < item.countInStock) {
                                      handleQtyChange(item, item.qty + 1);
                                  } else {
                                      toast.error(t('maxStockReached') || "Max stock reached"); 
                                  }
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-white"
                          >
                              <FaPlus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(currentId)}
                          disabled={isUpdating}
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-50"
                          title={t('remove') || "Remove"}
                        >
                          <FaTrash />
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-[400px]">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 sticky top-24 shadow-2xl animate-fade-in">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-4">
                {t('orderSummary') || "Order Summary"}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                  <span>{t('subtotal') || "Subtotal"}</span>
                  <span className="text-gray-900 dark:text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                  <span>{t('tax') || "Tax"} ({TAX_RATE * 100}%)</span>
                  <span className="text-gray-900 dark:text-white font-bold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                  <span>{t('shippingFee') || "Shipping"}</span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    {shipping === 0 ? (t('free') || 'FREE') : `$${shipping}`}
                  </span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 mt-4">
                     <div className="flex justify-between items-center">
                        <span className="text-gray-900 dark:text-white font-black text-lg">{t('total') || "TOTAL"}</span>
                        <span className="text-primary font-black text-3xl animate-pulse-once">${total.toFixed(2)}</span>
                     </div>
                </div>
              </div>

              <button
                onClick={checkoutHandler}
                className="w-full bg-gradient-to-r from-primary to-orange-600 hover:shadow-lg hover:shadow-orange-500/30 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide group"
              >
                {t('proceedCheckout') || "CHECKOUT"} 
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartScreen;