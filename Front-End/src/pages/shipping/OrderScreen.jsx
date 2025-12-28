import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { ENDPOINTS, getImageUrl } from '../../api'; 
import { FaUser, FaShippingFast, FaBoxOpen, FaCheck, FaTimes, FaCalendarAlt, FaEnvelope, FaSpinner, FaCreditCard } from 'react-icons/fa';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const OrderScreen = () => {
  const { id } = useParams();
  const { t } = useSettings();
  
  // --- State Management ---
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false); 

  const userInfo = useMemo(() => {
      try {
          return JSON.parse(localStorage.getItem('userInfo'));
      } catch {
          return null;
      }
  }, []);

  // --- Fetch Order Logic ---
  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(ENDPOINTS.ORDER_DETAILS(id));
      setOrder(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Order Error:", err);
      setError(err.response?.data?.detail || t('errorLoadingOrder') || "Error loading order");
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // --- Payment & Delivery Handlers ---
  
  const successPaymentHandler = async (paymentResult) => {
    try {
      setPaymentLoading(true);
      await api.put(ENDPOINTS.PAY_ORDER(id), paymentResult);
      alert(t('paymentSuccessful') || "Payment Successful! 🎉");
      await fetchOrder(); 
    } catch (err) {
      console.error("Payment Error:", err);
      alert(t('errorPayment') || "Error updating payment status");
    } finally {
        setPaymentLoading(false);
    }
  };

  const deliverHandler = async () => {
    if (!window.confirm("Mark this order as delivered?")) return;
    try {
        await api.put(ENDPOINTS.DELIVER_ORDER(id), {});
        alert(t('orderDelivered') || "Order Delivered! 🚚");
        await fetchOrder();
    } catch (error) {
        console.error("Delivery Error:", error);
        alert(error.response?.data?.detail || t('errorDelivery') || "Error updating delivery status");
    }
  };

  const StatusBadge = ({ isSuccess, labelSuccess, labelFail, date, prefix }) => {
      const isPaid = isSuccess; 
      const bgClass = isPaid ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      
      return (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold border transition-colors ${bgClass}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPaid ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100'}`}>
                {isPaid ? <FaCheck size={14}/> : <FaTimes size={14}/>}
            </div>
            <div className="flex flex-col">
                <span className="text-sm uppercase tracking-wide">{isPaid ? labelSuccess : labelFail}</span>
                {isPaid && date && <span className="text-xs opacity-80">{prefix} {date.substring(0, 10)}</span>}
            </div>
        </div>
      );
  };

  // --- Render States ---
  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-primary" />
          <span className="text-gray-500 font-bold animate-pulse">{t('loadingOrder') || "Loading Order Details..."}</span>
      </div>
  );

  if (error) return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
          <div className="text-red-500 text-6xl mb-4"><FaTimes /></div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/" className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Go Home</Link>
      </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 animate-fade-in">
      <Meta title={`${t('order') || 'Order'} #${order._id || order.id}`} />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    {t('order') || "ORDER"} <span className="text-primary">#{ (order._id || order.id).toString().substring(0, 8) }</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2 mt-1">
                    <FaCalendarAlt /> {order.createdAt?.substring(0, 10)}
                </p>
            </div>
            
            <div className="flex gap-2">
                 <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border ${order.isPaid ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                    {order.isPaid ? 'PAID' : 'NOT PAID'}
                 </div>
                 <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border ${order.isDelivered ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'}`}>
                    {order.isDelivered ? 'DELIVERED' : 'PENDING'}
                 </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl"><FaShippingFast /></div>
                    {t('shipping') || "SHIPPING"}
                </h2>
                
                <div className="space-y-4 text-gray-600 dark:text-gray-300 font-medium ml-2 mb-6">
                    <p className="flex items-center gap-3"><FaUser className="text-gray-400"/> {order.user?.name}</p>
                    <p className="flex items-center gap-3"><FaEnvelope className="text-gray-400"/> <a href={`mailto:${order.user?.email}`} className="hover:text-primary underline transition">{order.user?.email}</a></p>
                    <div className="flex items-start gap-3">
                        <span className="mt-1"><FaShippingFast className="text-gray-400"/></span> 
                        <span>
                            {order.shippingAddress?.address}, <br/>
                            {order.shippingAddress?.city}, {order.shippingAddress?.country}
                        </span>
                    </div>
                </div>
                
                <StatusBadge 
                    isSuccess={order.isDelivered} 
                    labelSuccess="Delivered" 
                    labelFail="Not Delivered Yet"
                    date={order.deliveredAt}
                    prefix="On"
                />
            </div>

            {/* Payment Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl"><FaCreditCard /></div>
                    {t('payment') || "PAYMENT"}
                </h2>
                <p className="text-gray-900 dark:text-white font-bold mb-6 ml-2 flex items-center gap-2">
                    Method: <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-sm">{order.paymentMethod}</span>
                </p>
                
                <StatusBadge 
                    isSuccess={order.isPaid} 
                    labelSuccess="Paid" 
                    labelFail="Not Paid Yet"
                    date={order.paidAt}
                    prefix="On"
                />
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl"><FaBoxOpen /></div>
                    {t('orderItems') || "ITEMS"}
                </h2>
                <div className="space-y-4">
                    {order.orderItems?.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-3xl border border-gray-100 dark:border-white/5 transition hover:bg-white dark:hover:bg-gray-700">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
                                <img 
                                    src={getImageUrl(item.image)} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain p-1" 
                                    loading="lazy"
                                    onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link to={`/product/${item.product}`} className='text-gray-900 dark:text-white font-bold text-lg hover:text-primary transition line-clamp-1'>
                                    {item.name}
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                    {item.qty} x ${item.price}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-900 dark:text-white font-black text-lg block">${(item.qty * item.price).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 sticky top-28 shadow-2xl">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-white/10 pb-4 uppercase tracking-wider">
                    {t('orderSummary') || "Summary"}
                </h3>
                <div className="space-y-4 text-sm font-medium mb-8">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>{t('items') || "Items"}</span><span className="text-gray-900 dark:text-white font-bold">${(order.totalPrice - order.taxPrice - order.shippingPrice).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>{t('shippingFee') || "Shipping"}</span><span className="text-gray-900 dark:text-white font-bold">${order.shippingPrice}</span></div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>{t('tax') || "Tax"}</span><span className="text-gray-900 dark:text-white font-bold">${order.taxPrice}</span></div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 dark:border-gray-600 mt-4">
                        <span className="text-gray-900 dark:text-white font-black text-lg">{t('total') || "TOTAL"}</span>
                        <span className="text-primary font-black text-3xl">${order.totalPrice}</span>
                    </div>
                </div>
                
                {/* PayPal Buttons */}
                {!order.isPaid && !paymentLoading && (
                    <div className="z-0 relative animate-fade-in-up">
                        <PayPalScriptProvider options={{ "client-id": "AUSM3-CzTVJEjqrXYXi9j3ct7D-kpJzzAU3q9qJ1AgpYBPyXs3uhV5ocIu_pIB-hciku3VGOE52ccmVD", currency: "USD" }}>
                            <PayPalButtons 
                                style={{ layout: "vertical", shape: "rect", borderRadius: 12, height: 48 }}
                                createOrder={(data, actions) => {
                                    return actions.order.create({ 
                                        purchase_units: [{ amount: { value: order.totalPrice.toString() } }] 
                                    });
                                }}
                                onApprove={(data, actions) => {
                                    return actions.order.capture().then((details) => { successPaymentHandler(details); });
                                }}
                                onError={(err) => {
                                    console.error("PayPal Error:", err);
                                    alert("Payment failed or cancelled.");
                                }}
                            />
                        </PayPalScriptProvider>
                    </div>
                )}

                {/* Loading during payment processing */}
                {paymentLoading && (
                    <div className="w-full py-4 flex justify-center items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                        <FaSpinner className="animate-spin text-primary" />
                        <span className="text-sm font-bold">Processing Payment...</span>
                    </div>
                )}

                {/* Admin Delivery Button */}
                {userInfo && userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                    <button 
                        onClick={deliverHandler}
                        className="w-full bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 hover:text-white dark:hover:bg-white dark:hover:text-dark text-white font-bold py-4 rounded-2xl transition shadow-lg mt-4 flex justify-center items-center gap-2 uppercase tracking-wide transform active:scale-95"
                    >
                        {t('markAsDelivered') || "MARK AS DELIVERED"} 🚚
                    </button>
                )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderScreen;