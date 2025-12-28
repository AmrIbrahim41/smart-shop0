import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ENDPOINTS } from '../../api';
import { FaTrash, FaCalendarAlt, FaUser, FaClipboardList, FaCheck, FaTimes, FaSync } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const OrderListScreen = () => {
    // --- State Management ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { t } = useSettings();

    // --- 1. & 2. Performance & Fetching Logic ---
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(ENDPOINTS.ORDERS_LIST);
            setOrders(data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.response && err.response.data.message ? err.response.data.message : err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- Delete Handler ---
    const deleteHandler = async (id) => {
        if (window.confirm(t('confirmDeleteOrder') || 'Are you sure you want to delete this order?')) {
            try {
                await api.delete(ENDPOINTS.DELETE_ORDER(id));

                setOrders((prevOrders) => prevOrders.filter((order) => (order._id || order.id) !== id));
            } catch (error) {
                alert(t('errorDelete') || "Error deleting order");
            }
        }
    };

    // --- Helper for ID Extraction ---
    const getOrderId = (order) => order._id || order.id;

    return (
        <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
            <Meta title={t('orderList') || "Orders List"} />

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                        <span className="p-3 bg-primary/10 text-primary rounded-2xl"><FaClipboardList /></span>
                        {t('orders') || "Orders"}
                        {!loading && <span className="text-sm opacity-50 font-medium">({orders.length})</span>}
                    </h1>

                    {/* referesh */}
                    <button
                        onClick={fetchOrders}
                        className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm hover:shadow-md transition text-gray-500 hover:text-primary"
                        title="Refresh List"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <div className="text-primary font-bold animate-pulse">Loading Orders...</div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <FaClipboardList className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400">No Orders Found</h2>
                    </div>
                ) : (
                    <>
                        {/* Mobile View (Cards) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {orders.map((order) => {
                                const id = getOrderId(order);
                                return (
                                    <div key={id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 dark:text-white text-lg">ID: {id.toString().substring(0, 8)}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <FaUser size={10} /> {order.user?.name || 'Guest'}
                                                </span>
                                            </div>
                                            <span className="font-black text-primary text-xl">${order.totalPrice}</span>
                                        </div>

                                        <div className="flex gap-2 mb-4">
                                            <StatusBadge isPositive={order.isPaid} labelPositive="PAID" labelNegative="NOT PAID" />
                                            <StatusBadge isPositive={order.isDelivered} labelPositive="SENT" labelNegative="PENDING" isWarning={!order.isDelivered} />
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-white/5 pt-3 mt-3">
                                            <span className="flex items-center gap-1"><FaCalendarAlt /> {order.createdAt?.substring(0, 10)}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => navigate(`/order/${id}`)} className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-gray-700 dark:text-white font-bold hover:bg-gray-200 transition">View</button>
                                                <button onClick={() => deleteHandler(id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition"><FaTrash /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop View (Table) */}
                        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-xs font-extrabold tracking-wider">
                                        <th className="p-6 pl-8">ID</th>
                                        <th className="p-6">User</th>
                                        <th className="p-6">Date</th>
                                        <th className="p-6">Total</th>
                                        <th className="p-6 text-center">Paid</th>
                                        <th className="p-6 text-center">Delivered</th>
                                        <th className="p-6 text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {orders.map((order) => {
                                        const id = getOrderId(order);
                                        return (
                                            <tr key={id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition duration-200 group">
                                                <td className="p-6 pl-8 font-bold text-gray-900 dark:text-white">#{id.toString().substring(0, 8)}..</td>
                                                <td className="p-6 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {order.user?.name ? order.user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    {order.user?.name || 'Unknown'}
                                                </td>
                                                <td className="p-6 text-gray-500">{order.createdAt?.substring(0, 10)}</td>
                                                <td className="p-6 font-bold text-primary text-base">${order.totalPrice}</td>
                                                <td className="p-6 text-center">
                                                    {order.isPaid
                                                        ? <FaCheck className="text-green-500 mx-auto text-lg" />
                                                        : <FaTimes className="text-red-400 mx-auto text-lg opacity-50" />}
                                                </td>
                                                <td className="p-6 text-center">
                                                    {order.isDelivered
                                                        ? <FaCheck className="text-green-500 mx-auto text-lg" />
                                                        : <FaTimes className="text-yellow-500 mx-auto text-lg opacity-50" />}
                                                </td>
                                                <td className="p-6 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button onClick={() => navigate(`/order/${id}`)} className="bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-white text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold text-xs uppercase transition shadow-sm">
                                                            Details
                                                        </button>
                                                        <button onClick={() => deleteHandler(id)} className="bg-red-50 dark:bg-red-900/10 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 p-2 rounded-xl transition shadow-sm">
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ isPositive, labelPositive, labelNegative, isWarning }) => (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${isPositive
            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
            : isWarning
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
        }`}>
        {isPositive ? <FaCheck /> : <FaTimes />} {isPositive ? labelPositive : labelNegative}
    </span>
);

export default OrderListScreen;