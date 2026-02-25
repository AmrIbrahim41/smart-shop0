import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaShoppingBag, FaStore, FaBoxOpen, FaCheck, FaTimes, FaCalendarAlt,
    FaChevronRight, FaSpinner, FaArrowLeft, FaReceipt, FaTag, FaStar,
    FaChevronLeft
} from 'react-icons/fa';
import { apiService, getImageUrl } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import Meta from '../../components/tapheader/Meta';
import toast from 'react-hot-toast';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================
const pageVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.25 } },
};

const tabContentVariants = {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Coloured pill badge for payment / delivery status */
const StatusPill = ({ success, labelYes, labelNo, small }) => {
    const base = small
        ? 'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border'
        : 'px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border';

    return success ? (
        <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800`}>
            <FaCheck className="inline mr-1 text-[9px]" />{labelYes}
        </span>
    ) : (
        <span className={`${base} bg-rose-50 text-rose-600 border-rose-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800`}>
            <FaTimes className="inline mr-1 text-[9px]" />{labelNo}
        </span>
    );
};

const DeliveryPill = ({ isDelivered, small }) => {
    const base = small
        ? 'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border'
        : 'px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border';

    return isDelivered ? (
        <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800`}>
            <FaCheck className="inline mr-1 text-[9px]" />Delivered
        </span>
    ) : (
        <span className={`${base} bg-amber-50 text-amber-600 border-amber-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-800`}>
            ⏳ Pending
        </span>
    );
};

/** Empty state illustration */
const EmptyState = ({ tab }) => (
    <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-24 text-center"
    >
        <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-orange-50 dark:from-primary/20 dark:to-orange-900/20 flex items-center justify-center mx-auto">
                {tab === 'store' ? (
                    <FaStore className="text-5xl text-primary/70" />
                ) : (
                    <FaShoppingBag className="text-5xl text-primary/70" />
                )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-4 border-slate-50 dark:border-gray-900 flex items-center justify-center shadow-lg shadow-slate-200/50">
                <span className="text-xl">😕</span>
            </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
            {tab === 'store' ? 'No Store Orders Yet' : 'No Orders Yet'}
        </h3>
        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium max-w-xs leading-relaxed">
            {tab === 'store'
                ? 'Orders containing your products will appear here once customers start buying.'
                : "You haven't placed any orders yet. Head to the shop and find something you love!"}
        </p>
        {tab !== 'store' && (
            <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/30 hover:bg-orange-600 transition-all hover:scale-105 active:scale-95"
            >
                <FaStore /> Start Shopping
            </Link>
        )}
    </motion.div>
);

/** Loading skeleton for an order card */
const OrderCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-[1.75rem] border border-slate-200/70 dark:border-white/5 p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-gray-700 rounded-full" />
                <div className="h-3 w-32 bg-slate-100 dark:bg-gray-700/60 rounded-full" />
            </div>
            <div className="flex gap-2">
                <div className="h-7 w-16 bg-slate-100 dark:bg-gray-700/60 rounded-lg" />
                <div className="h-7 w-20 bg-slate-100 dark:bg-gray-700/60 rounded-lg" />
            </div>
        </div>
        <div className="flex gap-3 my-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-gray-700/60 flex-shrink-0" />
            ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="h-4 w-20 bg-slate-100 dark:bg-gray-700/60 rounded-full" />
            <div className="h-8 w-28 bg-primary/10 rounded-xl" />
        </div>
    </div>
);

// ── Shared Pagination Controls ───────────────────────────────────────────────
const PaginationBar = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-3 mt-8">
            <button
                onClick={() => onPageChange(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-white dark:bg-gray-800 border border-slate-200/70 dark:border-white/10 rounded-xl text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
                <FaChevronLeft className="text-xs" /> Prev
            </button>
            <span className="px-4 py-2 text-sm font-black text-slate-900 dark:text-white bg-primary/10 rounded-lg">
                {currentPage} <span className="text-slate-500 font-bold mx-1">/</span> {totalPages}
            </span>
            <button
                onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-white dark:bg-gray-800 border border-slate-200/70 dark:border-white/10 rounded-xl text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
                Next <FaChevronRight className="text-xs" />
            </button>
        </div>
    );
};

// =============================================================================
// PURCHASE ORDER CARD (Customer View)
// =============================================================================
const PurchaseOrderCard = ({ order, index }) => {
    const navigate = useNavigate();

    // SAFE FALLBACKS FOR ALL VARIABLES
    const orderId = order?.id || order?._id || order?.order_id || order?.orderId;
    const safeDisplayId = orderId ? String(orderId).slice(0, 8).toUpperCase() : 'UNKNOWN';
    const items = order?.order_items || order?.items || [];
    const previewItems = items.slice(0, 4);
    const remaining = items.length - previewItems.length;
    const createdAt = order?.created_at || order?.createdAt || '';
    const totalPrice = order?.total_price || order?.totalPrice || 0;

    return (
        <motion.div
            variants={cardVariants}
            custom={index}
            onClick={() => orderId && navigate(`/order/${orderId}`)}
            className="group bg-white dark:bg-gray-800 rounded-[1.75rem] border border-slate-200/70 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-black/30 hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Card top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-orange-400 to-yellow-400 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />

            <div className="p-6">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FaReceipt className="text-primary text-sm" />
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                Order
                            </span>
                            <span className="text-base font-black text-slate-800 dark:text-white font-mono">
                                #{safeDisplayId}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 font-medium">
                            <FaCalendarAlt className="text-[10px]" />
                            <span>{createdAt?.substring(0, 10) || '—'}</span>
                            {order?.shipping_address?.city && (
                                <>
                                    <span className="text-slate-300 dark:text-gray-600">·</span>
                                    <span>{order.shipping_address.city}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <StatusPill success={order?.is_paid} labelYes="Paid" labelNo="Unpaid" small />
                        <DeliveryPill isDelivered={order?.is_delivered} small />
                    </div>
                </div>

                {/* Item image previews */}
                {previewItems.length > 0 && (
                    <div className="flex items-center gap-2.5 mb-5">
                        {previewItems.map((item, i) => (
                            <div
                                key={i}
                                className="w-14 h-14 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-gray-700/50 overflow-hidden flex-shrink-0 shadow-sm"
                            >
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name || 'Product Image'}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                        {remaining > 0 && (
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-white/5">
                                <span className="text-xs font-black text-slate-500 dark:text-gray-400">+{remaining}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Item summary text */}
                {items.length > 0 && (
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium line-clamp-1 mb-5">
                        {items.length === 1
                            ? items[0].name
                            : `${items[0]?.name}${items.length > 1 ? ` & ${items.length - 1} more item${items.length > 2 ? 's' : ''}` : ''}`}
                    </p>
                )}

                {/* Footer row */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                            Order Total
                        </p>
                        <span className="text-xl font-black text-slate-800 dark:text-white">
                            ${Number(totalPrice).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => orderId && navigate(`/order/${orderId}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 dark:bg-white/10 text-white dark:text-gray-100 rounded-xl font-bold text-sm shadow-md hover:bg-primary dark:hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <span>View Full Order</span>
                        <FaChevronRight className="text-xs" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// =============================================================================
// STORE ORDER CARD (Seller View) — highlights seller's specific items
// =============================================================================
const StoreOrderCard = ({ order, myProductIds, index }) => {
    const navigate = useNavigate();

    // SAFE FALLBACKS FOR ALL VARIABLES
    const orderId = order?.id || order?._id || order?.order_id || order?.orderId;
    const safeDisplayId = orderId ? String(orderId).slice(0, 8).toUpperCase() : 'UNKNOWN';
    const items = order?.order_items || order?.items || [];
    const createdAt = order?.created_at || order?.createdAt || '';
    const totalPrice = order?.total_price || order?.totalPrice || 0;

    const myItems    = items.filter(item => myProductIds.has(Number(item.product)));
    const otherItems = items.filter(item => !myProductIds.has(Number(item.product)));

    return (
        <motion.div
            variants={cardVariants}
            custom={index}
            className="bg-white dark:bg-gray-800 rounded-[1.75rem] border border-slate-200/70 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-black/30 transition-all duration-300 overflow-hidden"
        >
            {/* Top stripe — store accent */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FaStore className="text-blue-500 text-sm" />
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                Store Order
                            </span>
                            <span className="text-base font-black text-slate-800 dark:text-white font-mono">
                                #{safeDisplayId}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 font-medium">
                            <FaCalendarAlt className="text-[10px]" />
                            <span>{createdAt?.substring(0, 10) || '—'}</span>
                            {order?.user?.email && (
                                <>
                                    <span className="text-slate-300 dark:text-gray-600">·</span>
                                    <span>Customer: {order.user.name || order.user.email}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <StatusPill success={order?.is_paid} labelYes="Paid" labelNo="Unpaid" small />
                        <DeliveryPill isDelivered={order?.is_delivered} small />
                    </div>
                </div>

                {/* MY ITEMS section */}
                {myItems.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/15 text-primary text-xs font-black rounded-full border border-primary/20">
                                <FaStar className="text-[9px]" />
                                YOUR ITEMS ({myItems.length})
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            {myItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3.5 bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20 rounded-2xl p-3.5"
                                >
                                    <div className="w-12 h-12 rounded-xl border border-primary/20 bg-white dark:bg-gray-700 overflow-hidden flex-shrink-0 shadow-sm">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name || 'Product Image'}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                                            {item.qty} × ${Number(item.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="font-black text-slate-800 dark:text-white text-sm">
                                            ${(item.qty * Number(item.price || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* OTHER ITEMS (dimmed) */}
                {otherItems.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs font-bold rounded-full">
                                <FaBoxOpen className="text-[9px]" />
                                OTHER ITEMS ({otherItems.length})
                            </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {otherItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 opacity-70"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name || 'Product Image'}
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 dark:text-gray-400 line-clamp-1 max-w-[120px]">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                            Order Total
                        </p>
                        <span className="text-xl font-black text-slate-800 dark:text-white">
                            ${Number(totalPrice).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => orderId && navigate(`/order/${orderId}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 dark:bg-white/10 text-white dark:text-gray-100 rounded-xl font-bold text-sm shadow-md hover:bg-primary dark:hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <span>View Full Order</span>
                        <FaChevronRight className="text-xs" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const MyOrdersScreen = () => {
    const navigate = useNavigate();
    const { t } = useSettings();

    const userInfo = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('userInfo')); }
        catch { return null; }
    }, []);

    const isAdmin  = userInfo?.isAdmin === true || userInfo?.is_admin === true;
    const isVendor =
        userInfo?.profile?.userType === 'vendor' ||
        userInfo?.profile?.user_type === 'vendor' ||
        userInfo?.user_type === 'vendor' ||
        userInfo?.userType === 'vendor';
    const isSeller = isAdmin || isVendor;

    const [activeTab, setActiveTab] = useState('purchases');

    // ── My purchases state ───────────────────────────────────────────────────
    const [myOrders, setMyOrders]           = useState([]);
    const [myOrdersPage, setMyOrdersPage]   = useState(1);
    const [myOrdersPages, setMyOrdersPages] = useState(1);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);

    // ── Seller / store orders state ──────────────────────────────────────────
    const [sellerOrders, setSellerOrders]           = useState([]);
    const [sellerOrdersPage, setSellerOrdersPage]   = useState(1);
    const [sellerOrdersPages, setSellerOrdersPages] = useState(1);
    const [myProductIds, setMyProductIds]           = useState(new Set());
    const [sellerLoading, setSellerLoading]         = useState(false);

    // ── Redirect unauthenticated users ───────────────────────────────────────
    useEffect(() => {
        if (!userInfo) navigate('/login');
    }, [userInfo, navigate]);

    // ── Fetch my purchase orders (paginated) ─────────────────────────────────
    const fetchMyOrders = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiService.getMyOrders(page);
            // Handle both plain array and paginated { orders, page, pages } formats
            if (Array.isArray(data)) {
                setMyOrders(data);
                setMyOrdersPages(1);
            } else {
                setMyOrders(data.orders || []);
                setMyOrdersPage(data.page || 1);
                setMyOrdersPages(data.pages || 1);
            }
        } catch (err) {
            console.error('MyOrders fetch error:', err);
            setError(err.response?.data?.detail || 'Failed to load your orders.');
            toast.error('Could not fetch your orders.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch seller orders + product ids for highlighting ───────────────────
    const fetchSellerData = useCallback(async (page = 1) => {
        if (!isSeller) return;
        try {
            setSellerLoading(true);
            const [ordersRes, productsRes] = await Promise.all([
                apiService.getSellerOrders(page),
                apiService.getMyProducts(),
            ]);

            // Seller orders — handle paginated envelope
            const ordersData = ordersRes.data;
            if (Array.isArray(ordersData)) {
                setSellerOrders(ordersData);
                setSellerOrdersPages(1);
            } else {
                setSellerOrders(ordersData.orders || ordersData.results || []);
                setSellerOrdersPage(ordersData.page || 1);
                setSellerOrdersPages(ordersData.pages || 1);
            }

            // Build a Set of the seller's product IDs for O(1) lookup
            const productsData = productsRes.data;
            const products = Array.isArray(productsData)
                ? productsData
                : (productsData.products || productsData.results || []);
            setMyProductIds(new Set(products.map(p => Number(p.id))));
        } catch (err) {
            console.error('SellerOrders fetch error:', err);
            toast.error('Could not fetch store orders.');
        } finally {
            setSellerLoading(false);
        }
    }, [isSeller]);

    // Fetch purchases on page change
    useEffect(() => { fetchMyOrders(myOrdersPage); }, [myOrdersPage]); // eslint-disable-line
    // Fetch seller orders on page change
    useEffect(() => {
        if (isSeller) fetchSellerData(sellerOrdersPage);
    }, [isSeller, sellerOrdersPage]); // eslint-disable-line

    // ── Render: Loading ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-slate-50/80 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 h-10 w-48 bg-slate-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                    <div className="space-y-5">
                        {[1, 2, 3].map(i => <OrderCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    // ── Render: Error ─────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-4 px-4 bg-slate-50/80 dark:bg-gray-900">
                <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FaTimes className="text-3xl text-rose-500" />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Something went wrong</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm text-center max-w-sm">{error}</p>
                <button
                    onClick={() => fetchMyOrders(1)}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-orange-600 shadow-md transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const tabs = [
        { key: 'purchases', label: 'My Purchases', icon: <FaShoppingBag />, count: myOrders.length },
        ...(isSeller ? [{ key: 'store', label: 'Store Orders', icon: <FaStore />, count: sellerOrders.length }] : []),
    ];

    const currentOrders  = activeTab === 'purchases' ? myOrders : sellerOrders;
    const currentPage    = activeTab === 'purchases' ? myOrdersPage : sellerOrdersPage;
    const currentPages   = activeTab === 'purchases' ? myOrdersPages : sellerOrdersPages;
    const onPageChange   = activeTab === 'purchases'
        ? setMyOrdersPage
        : setSellerOrdersPage;

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen pt-28 pb-16 px-4 md:px-6 bg-slate-50/80 dark:bg-gray-900 transition-colors duration-500"
        >
            <Meta title="My Orders" />
            <div className="max-w-4xl mx-auto">

                {/* ── PAGE HEADER ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition mb-3 group"
                        >
                            <FaArrowLeft className="text-[10px] group-hover:-translate-x-0.5 transition-transform" />
                            Back
                        </button>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            {activeTab === 'store' ? (
                                <>Store <span className="text-primary">Orders</span></>
                            ) : (
                                <>My <span className="text-primary">Orders</span></>
                            )}
                        </h1>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mt-1">
                            {activeTab === 'store'
                                ? 'Track orders containing your products'
                                : 'View and manage all your purchases'}
                        </p>
                    </div>

                    {/* Order count badge */}
                    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border border-slate-200/70 dark:border-white/5 rounded-2xl px-5 py-3 shadow-sm text-center">
                        <p className="text-3xl font-black text-primary leading-none">
                            {currentOrders.length}
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {currentOrders.length === 1 ? 'Order' : 'Orders'}
                        </p>
                    </div>
                </div>

                {/* ── TAB SWITCHER (seller/admin only) ── */}
                {isSeller && (
                    <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/70 dark:border-white/5 p-1.5 shadow-sm mb-8 w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                    activeTab === tab.key
                                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <span className={`text-base ${activeTab === tab.key ? 'text-white' : ''}`}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    activeTab === tab.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.key && (
                                    <motion.div
                                        layoutId="tab-active-indicator"
                                        className="absolute inset-0 rounded-xl bg-primary -z-10"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── TAB CONTENT ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Loading state for seller orders tab */}
                        {activeTab === 'store' && sellerLoading ? (
                            <div className="space-y-5">
                                {[1, 2].map(i => <OrderCardSkeleton key={i} />)}
                            </div>
                        ) : currentOrders.length === 0 ? (
                            <EmptyState tab={activeTab} />
                        ) : (
                            <>
                                <motion.div
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-5"
                                >
                                    {activeTab === 'purchases'
                                        ? currentOrders.map((order, index) => (
                                            <PurchaseOrderCard key={order?.id || index} order={order} index={index} />
                                        ))
                                        : currentOrders.map((order, index) => (
                                            <StoreOrderCard
                                                key={order?.id || index}
                                                order={order}
                                                myProductIds={myProductIds}
                                                index={index}
                                            />
                                        ))
                                    }
                                </motion.div>

                                {/* Pagination Controls */}
                                <PaginationBar
                                    currentPage={currentPage}
                                    totalPages={currentPages}
                                    onPageChange={onPageChange}
                                />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── FOOTER HELP TEXT ── */}
                {currentOrders.length > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center text-xs text-slate-400 dark:text-gray-600 font-medium mt-10"
                    >
                        Click on any order card to view full details &amp; track your shipment.
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
};

export default MyOrdersScreen;
