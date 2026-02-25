/**
 * OrderListScreen.jsx
 *
 * Admin Order Management — Fully Optimized UI/UX for Mobile & Desktop
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaSpinner, FaCheckCircle, FaTruck,
    FaEye, FaShoppingCart, FaExclamationTriangle,
    FaSync, FaTimes, FaMoneyBillWave, FaCalendarAlt,
    FaUser, FaHashtag, FaFilter, FaTimesCircle, FaDownload
} from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';
import Meta from '../../components/tapheader/Meta';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const orderId = (order) => order.id || order._id;

const customerName = (order) =>
    order.user?.name || order.user?.username || order.user?.email || 'Guest';

const customerInitial = (order) => customerName(order).charAt(0).toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
    { value: 'all',       label: 'All Orders' },
    { value: 'paid',      label: 'Paid' },
    { value: 'unpaid',    label: 'Unpaid' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'pending',   label: 'Pending Delivery' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status Badges (For Desktop Table)
// ─────────────────────────────────────────────────────────────────────────────

const PaidBadge = ({ order, onMarkPaid, updating }) => {
    const id = orderId(order);
    const isBusy = updating === id;

    if (order.is_paid) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 whitespace-nowrap">
                <FaCheckCircle />
                {fmtDate(order.paid_at)}
            </span>
        );
    }
    return (
        <button
            onClick={() => onMarkPaid(id)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
            {isBusy ? <FaSpinner className="animate-spin" /> : <><FaMoneyBillWave /> Mark Paid</>}
        </button>
    );
};

const DeliveredBadge = ({ order, onMarkDelivered, updating }) => {
    const id = orderId(order);
    const isBusy = updating === id;

    if (order.is_delivered) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                <FaTruck />
                {fmtDate(order.delivered_at)}
            </span>
        );
    }
    return (
        <button
            onClick={() => onMarkDelivered(id)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
            {isBusy ? <FaSpinner className="animate-spin" /> : <><FaTruck /> Mark Delivered</>}
        </button>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Summary Bar
// ─────────────────────────────────────────────────────────────────────────────

const SummaryBar = ({ orders }) => {
    const paidCount      = orders.filter(o => o.is_paid).length;
    const deliveredCount = orders.filter(o => o.is_delivered).length;
    const totalRevenue   = orders
        .filter(o => o.is_paid)
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
                { label: 'Total Orders',     value: orders.length,                       color: 'text-gray-900 dark:text-white', bg: 'bg-gray-50 dark:bg-gray-700/50' },
                { label: 'Paid Orders',      value: `${paidCount} / ${orders.length}`,   color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
                { label: 'Total Revenue',    value: `$${totalRevenue.toFixed(2)}`,        color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20' },
            ].map(({ label, value, color, bg }) => (
                <div
                    key={label}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 flex items-center justify-between sm:block sm:text-center"
                >
                    <div className="sm:hidden text-sm font-bold text-gray-500 dark:text-gray-400">{label}</div>
                    <div>
                        <p className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
                        <p className="hidden sm:block text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const OrderListScreen = () => {
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [searchTerm, setSearchTerm]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [updating, setUpdating]       = useState(null);
    const [isExporting, setIsExporting] = useState(false); // حالة تحميل الملف

    // دالة تصدير الطلبات
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // نستخدم responseType: 'blob' لأننا نستقبل ملف وليس JSON
            const response = await api.get('/api/orders/export/csv/', {
                responseType: 'blob',
            });

            // إنشاء رابط وهمي لتحميل الملف في المتصفح
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'orders_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Orders exported successfully!', { icon: '📊' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export orders. Make sure you are an admin.');
        } finally {
            setIsExporting(false);
        }
    };

    const fetchOrders = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`api/orders/?page=${page}`);
            if (Array.isArray(data)) {
                setOrders(data);
                setTotalPages(1);
            } else if (data.orders) {
                setOrders(data.orders);
                setCurrentPage(data.page || 1);
                setTotalPages(data.pages || 1);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            const msg = err.response?.data?.detail || 'Failed to load orders';
            toast.error(msg);
            setError(msg);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(currentPage);
    }, [fetchOrders, currentPage]);

    const handleMarkDelivered = useCallback(async (id) => {
        setUpdating(id);
        try {
            await api.put(`api/orders/${id}/deliver/`);
            toast.success('Order marked as delivered', { icon: '📦' });
            fetchOrders(currentPage);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update order');
        } finally {
            setUpdating(null);
        }
    }, [currentPage, fetchOrders]);

    const handleMarkPaid = useCallback(async (id) => {
        setUpdating(id);
        try {
            await api.put(`api/orders/${id}/pay/`, {
                paid_at: new Date().toISOString(),
            });
            toast.success('Order marked as paid', { icon: '💳' });
            fetchOrders(currentPage);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update order');
        } finally {
            setUpdating(null);
        }
    }, [currentPage, fetchOrders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = term === '' ||
                String(orderId(order)).includes(term) ||
                customerName(order).toLowerCase().includes(term);

            const matchesStatus =
                filterStatus === 'all'       ? true :
                filterStatus === 'paid'      ? order.is_paid :
                filterStatus === 'unpaid'    ? !order.is_paid :
                filterStatus === 'delivered' ? order.is_delivered :
                filterStatus === 'pending'   ? !order.is_delivered :
                true;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, filterStatus]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-28">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12">
            <Meta title="Order Management - Admin" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            Order Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Monitor, update, and manage all customer orders.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* زر التصدير الجديد */}
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                            Export Excel
                        </button>

                        <button
                            onClick={() => fetchOrders(currentPage)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            <FaSync className={updating ? "animate-spin" : ""} /> Refresh
                        </button>
                        <span className="flex-1 md:flex-none px-5 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm text-center whitespace-nowrap">
                            <span className="text-primary mr-2">{filteredOrders.length}</span> Total
                        </span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <SummaryBar orders={orders} />
                </motion.div>

                {/* Search & Filters (Matching UserListScreen) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 sm:p-6 mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                                showFilters
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <FaFilter />
                            <span>Filters</span>
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden border-t border-gray-100 dark:border-white/10"
                            >
                                <div className="pt-4">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                        Filter by Status:
                                    </p>
                                    <div className="grid grid-cols-2 md:flex flex-wrap gap-2">
                                        {FILTER_TABS.map((tab) => (
                                            <button
                                                key={tab.value}
                                                onClick={() => setFilterStatus(tab.value)}
                                                className={`px-4 py-2.5 md:py-2 rounded-xl text-sm font-bold transition-colors text-center ${
                                                    filterStatus === tab.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {error && (
                    <div className="mb-8 flex items-center gap-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-6 py-5">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 text-xl">
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <p className="text-base font-bold text-red-700 dark:text-red-400">Failed to load orders</p>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    {filteredOrders.length === 0 && !error ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-16 text-center max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaShoppingCart className="text-4xl text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                No orders found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'We couldn\'t find any orders matching your criteria. Try adjusting your filters.'
                                    : 'There are no orders in the system yet. They will appear here once customers start purchasing.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View (Table) */}
                            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px]">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                {['Order ID', 'Customer', 'Date', 'Total', 'Payment', 'Delivery', 'Actions'].map((h) => (
                                                    <th key={h} className={`px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            <AnimatePresence>
                                                {filteredOrders.map((order, index) => {
                                                    const id = orderId(order);
                                                    return (
                                                        <motion.tr
                                                            key={id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                                            className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group"
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Link to={`/order/${id}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                                                    <FaHashtag size={10} /> {id}
                                                                </Link>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                                        {customerInitial(order)}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                        {customerName(order)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                {fmtDate(order.created_at)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-base font-black text-gray-900 dark:text-white">
                                                                ${Number(order.total_price || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <PaidBadge order={order} onMarkPaid={handleMarkPaid} updating={updating} />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <DeliveredBadge order={order} onMarkDelivered={handleMarkDelivered} updating={updating} />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                    <Link to={`/order/${id}`} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white text-gray-900 dark:text-white text-xs font-bold rounded-lg transition-colors">
                                                                        <FaEye /> View
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile View (Cards) */}
                            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {filteredOrders.map((order, index) => {
                                    const id = orderId(order);
                                    const isBusy = updating === id;
                                    
                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 flex flex-col gap-4"
                                        >
                                            {/* Card Header: ID & Price */}
                                            <div className="flex justify-between items-start border-b border-gray-100 dark:border-white/5 pb-4">
                                                <div>
                                                    <Link to={`/order/${id}`} className="text-base font-bold text-primary flex items-center gap-1.5 mb-1">
                                                        <FaHashtag size={12} /> {id}
                                                    </Link>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                        <FaCalendarAlt /> {fmtDate(order.created_at)}
                                                    </div>
                                                </div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg">
                                                    ${Number(order.total_price || 0).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Card Body: User Info */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-lg font-bold text-primary shrink-0">
                                                    {customerInitial(order)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">
                                                        {customerName(order)}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                        <FaUser size={12} className="text-gray-400" /> Customer
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer: Status Badges & Actions */}
                                            <div className="flex flex-col gap-3 pt-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {order.is_paid ? (
                                                        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                                                            <FaCheckCircle /> Paid
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkPaid(id)}
                                                            disabled={isBusy}
                                                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 active:scale-95 transition-transform disabled:opacity-50"
                                                        >
                                                            {isBusy ? <FaSpinner className="animate-spin" /> : <><FaMoneyBillWave /> Mark Paid</>}
                                                        </button>
                                                    )}

                                                    {order.is_delivered ? (
                                                        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                                            <FaTruck /> Delivered
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkDelivered(id)}
                                                            disabled={isBusy}
                                                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95 transition-transform disabled:opacity-50"
                                                        >
                                                            {isBusy ? <FaSpinner className="animate-spin" /> : <><FaTruck /> Mark Delivered</>}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <Link
                                                    to={`/order/${id}`}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-primary hover:text-white text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
                                                >
                                                    <FaEye /> View Full Order Details
                                                </Link>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Shared Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 flex justify-center mt-4">
                                     <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors active:scale-95"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm font-black text-gray-900 dark:text-white bg-primary/10 rounded-lg">
                                            {currentPage} <span className="text-gray-500 font-bold mx-1">/</span> {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors active:scale-95"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default OrderListScreen;