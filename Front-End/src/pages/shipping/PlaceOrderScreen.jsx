import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FaMapMarkerAlt, FaCreditCard, FaBox, 
    FaChevronRight, FaInfoCircle, FaShieldAlt 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// استيراد الـ Contexts الجديدة
import { useStoreSettings } from '../../context/Storesettingscontext';
// افترضنا وجود CartContext لإدارة السلة
// import { useCart } from '../../context/CartContext'; 

import api from '../../api';
import Meta from '../../components/tapheader/Meta';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';

const PlaceOrderScreen = () => {
    const navigate = useNavigate();
    
    // 1. جلب إعدادات الضرائب والشحن الديناميكية من السيرفر
    const { taxRate, shippingCost, freeShippingThreshold, loading: settingsLoading } = useStoreSettings();

    // ملاحظة: هنا يجب جلب بيانات السلة والعنوان من الـ State الخاصة بك (Redux أو Context)
    // كمثال، سنفترض وجود كائن cart يحتوي على البيانات
    const cart = {
        cartItems: [], // يتم جلبها من الـ store
        shippingAddress: {}, 
        paymentMethod: 'PayPal'
    };

    // 2. الحسابات المالية باستخدام القيم الديناميكية
    const itemsPrice = useMemo(() => 
        cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cart.cartItems]);

    // تحديد الشحن (مجاني إذا تخطى الحد الأدنى المضبط في الباك اند)
    const currentShipping = useMemo(() => 
        itemsPrice > freeShippingThreshold ? 0 : shippingCost,
    [itemsPrice, shippingCost, freeShippingThreshold]);

    const taxPrice = useMemo(() => 
        Number((taxRate * itemsPrice).toFixed(2)),
    [taxRate, itemsPrice]);

    const totalPrice = useMemo(() => 
        Number((itemsPrice + currentShipping + taxPrice).toFixed(2)),
    [itemsPrice, currentShipping, taxPrice]);

    const placeOrderHandler = async () => {
        try {
            // استخدام snake_case في البيانات المرسلة للباك اند كما طلبنا من كلود
            const orderData = {
                order_items: cart.cartItems,
                shipping_address: cart.shippingAddress,
                payment_method: cart.paymentMethod,
                items_price: itemsPrice,
                shipping_price: currentShipping,
                tax_price: taxPrice,
                total_price: totalPrice,
            };

            const { data } = await api.post('/api/orders/add/', orderData);
            toast.success('Order placed successfully!');
            navigate(`/order/${data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12">
            <Meta title="Place Order | Smart Shop" />
            <div className="max-w-6xl mx-auto px-4">
                <CheckoutSteps step1 step2 step3 step4 />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* الجانب الأيسر: تفاصيل الطلب */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* الشحن */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white">
                                <FaMapMarkerAlt className="text-indigo-600" /> Shipping Information
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                <strong>Address: </strong>
                                {cart.shippingAddress.address}, {cart.shippingAddress.city}, {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
                            </p>
                        </motion.div>

                        {/* المنتجات */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white">
                                <FaBox className="text-indigo-600" /> Order Items
                            </h2>
                            {cart.cartItems.length === 0 ? (
                                <p>Your cart is empty</p>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {cart.cartItems.map((item, index) => (
                                        <div key={index} className="py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                                <Link to={`/product/${item.product}`} className="text-sm font-medium hover:text-indigo-600 dark:text-slate-200 transition-colors">
                                                    {item.name}
                                                </Link>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {item.qty} x ${item.price} = ${(item.qty * item.price).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* الجانب الأيمن: ملخص السعر (Stripe-Style) */}
                    <div className="lg:col-span-1">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg sticky top-24"
                        >
                            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Order Summary</h2>
                            
                            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">${itemsPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">Shipping {currentShipping === 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">FREE</span>}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">${currentShipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">${taxPrice.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                                    <span>Total</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={cart.cartItems.length === 0 || settingsLoading}
                                onClick={placeOrderHandler}
                                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {settingsLoading ? 'Calculating...' : 'Place Order'}
                                <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <FaShieldAlt className="text-emerald-500" />
                                    Secure SSL Encrypted Checkout
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <FaInfoCircle className="text-indigo-500" />
                                    Review items and address before ordering.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceOrderScreen;