/**
 * AdminDashboard.jsx
 *
 * Admin Dashboard — Updated to match UserListScreen Theme
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FaUsers, FaShoppingCart, FaBoxOpen, FaDollarSign, FaChartLine,
  FaCheckCircle, FaClock, FaArrowUp, FaArrowDown, FaCog, FaSave, 
  FaTruck, FaPercent, FaSync, FaSpinner, FaReceipt, FaTag, 
  FaInfoCircle, FaExternalLinkAlt,
} from "react-icons/fa";
import api, { getImageUrl, apiService } from "../../api";
import toast from "react-hot-toast";
import Meta from "../../components/tapheader/Meta";
import { useStoreSettings } from "../../context/Storesettingscontext";

// ─────────────────────────────────────────────────────────────────────────────
// Motion preset & Hooks
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let startTime = null;
    const from = 0;

    const tick = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(parseFloat((from + (target - from) * eased).toFixed(decimals)));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton primitives
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`} />
);

const SkeletonStatCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
    <div className="flex items-center justify-between mb-5">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-12 h-4 rounded-full" />
    </div>
    <Skeleton className="w-28 h-6 rounded mb-2" />
    <Skeleton className="w-20 h-3.5 rounded" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  green: {
    stripe:  "bg-green-500",
    icon:    "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
    up:      "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
  },
  primary: {
    stripe:  "bg-primary",
    icon:    "bg-primary/10 text-primary",
    up:      "bg-primary/20 text-primary",
  },
  purple: {
    stripe:  "bg-purple-500",
    icon:    "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
    up:      "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
  },
  blue: {
    stripe:  "bg-blue-500",
    icon:    "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    up:      "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
  },
};

const StatCard = ({ title, rawValue, prefix = "", icon, color, growth, delay, decimals = 0 }) => {
  const animated = useCountUp(rawValue, 900, decimals);
  const { stripe, icon: iconCls, up } = COLORS[color];
  const displayed = decimals > 0
    ? animated.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : animated.toLocaleString("en-US");

  return (
    <motion.div
      {...fadeUp(delay)}
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 overflow-hidden hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 group"
    >
      <div className={`absolute left-0 top-4 bottom-4 w-[4px] ${stripe} rounded-r-full`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconCls}`}>
          {icon}
        </div>
        {growth !== undefined && growth !== 0 && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            growth > 0 ? up : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
          }`}>
            {growth > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>

      <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-2">
        {prefix}{displayed}
      </p>
      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{title}</p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Order status badge & Components
// ─────────────────────────────────────────────────────────────────────────────

const OrderStatusBadge = ({ isPaid, isDelivered }) => {
  if (isDelivered)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
        <FaCheckCircle size={10} /> Delivered
      </span>
    );
  if (isPaid)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
        <FaClock size={10} /> Processing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
      <FaClock size={10} /> Pending
    </span>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-bold text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-black text-white">
        ${Number(payload[0].value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const SettingsField = ({ label, name, value, onChange, step = "1", helper, prefix, suffix, disabled, min = "0" }) => (
  <div className="space-y-2">
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-4 text-gray-400 font-bold">{prefix}</span>}
      <input
        type="number" step={step} min={min} name={name}
        value={value} onChange={onChange} disabled={disabled}
        className={`
          w-full py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-bold
          disabled:opacity-50 disabled:cursor-not-allowed
          ${prefix ? "pl-10" : "pl-4"}
          ${suffix ? "pr-16" : "pr-4"}
        `}
      />
      {suffix && <span className="absolute right-4 text-gray-400 font-bold text-sm">{suffix}</span>}
    </div>
    {helper && (
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <FaInfoCircle size={12} className="text-gray-400" /> {helper}
      </p>
    )}
  </div>
);

const QuickActionCard = ({ to, icon, title, description, color, badge }) => (
  <Link
    to={to}
    className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${COLORS[color].icon} group-hover:bg-${color === 'primary' ? 'primary' : color + '-500'} group-hover:text-white`}>
        {icon}
      </div>
      {badge !== undefined && (
        <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
          {Number(badge).toLocaleString()}
        </span>
      )}
    </div>
    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</p>
    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-1">{description}</p>
    <div className="flex items-center gap-2 mt-4 text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
      Open <FaExternalLinkAlt size={12} />
    </div>
  </Link>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);

  const { taxRate, shippingCost, freeShippingThreshold, refreshSettings } = useStoreSettings();
  const [form, setForm] = useState({ tax_rate: "", shipping_cost: "", free_shipping_threshold: "" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      tax_rate: taxRate.toFixed(4),
      shipping_cost: shippingCost.toFixed(2),
      free_shipping_threshold: freeShippingThreshold.toFixed(2),
    });
    setDirty(false);
  }, [taxRate, shippingCost, freeShippingThreshold]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes, pRes] = await Promise.all([
        api.get("api/dashboard/stats/"),
        api.get("api/orders/"),
        api.get("api/products/"),
      ]);
      const s = sRes.data;
      const orders = Array.isArray(oRes.data) ? oRes.data : oRes.data.orders || [];
      const products = Array.isArray(pRes.data) ? pRes.data : pRes.data.products || [];

      setStats({
        totalRevenue: parseFloat(s.total_sales || 0),
        totalOrders: s.total_orders || 0,
        totalProducts: s.total_products || 0,
        totalUsers: s.total_users || 0,
      });
      setRecentOrders([...orders].sort(
        (a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
      ));
      setLowStockProducts(products.filter((p) => {
        const st = p.count_in_stock ?? p.countInStock ?? 0;
        return st > 0 && st <= 5;
      }));
      setSalesData(
        (s.sales_chart || []).map((item) => ({ ...item, sales: parseFloat(item.sales) })).reverse()
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setDirty(true);
  };

  const resetForm = () => {
    setForm({
      tax_rate: taxRate.toFixed(4),
      shipping_cost: shippingCost.toFixed(2),
      free_shipping_threshold: freeShippingThreshold.toFixed(2),
    });
    setDirty(false);
  };

  const saveSettings = async () => {
    const t = parseFloat(form.tax_rate);
    const s = parseFloat(form.shipping_cost);
    const f = parseFloat(form.free_shipping_threshold);
    if (isNaN(t) || t < 0 || t > 1) { toast.error("Tax rate: 0.0000–1.0000"); return; }
    if (isNaN(s) || s < 0) { toast.error("Shipping cost cannot be negative"); return; }
    if (isNaN(f) || f < 0) { toast.error("Threshold cannot be negative"); return; }

    setSaving(true);
    try {
      await apiService.updateStoreSettings({
        tax_rate: t.toFixed(4),
        shipping_cost: s.toFixed(2),
        free_shipping_threshold: f.toFixed(2),
      });
      await refreshSettings();
      setDirty(false);
      toast.success("Settings saved successfully!", { icon: "✅" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const PREVIEW_SUB = 250;
  const prevTax  = PREVIEW_SUB * (parseFloat(form.tax_rate) || 0);
  const prevShip = PREVIEW_SUB >= (parseFloat(form.free_shipping_threshold) || Infinity)
    ? 0 : (parseFloat(form.shipping_cost) || 0);
  const prevTotal = PREVIEW_SUB + prevTax + prevShip;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-28">
        <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-bold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-8">
      <Meta title="Admin Dashboard — SmartShop" />

      <div className="max-w-7xl mx-auto px-4 space-y-8">

        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Store performance at a glance.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm font-bold border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <FaSync size={14} /> Refresh
          </button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" rawValue={stats.totalRevenue} prefix="$" icon={<FaDollarSign />} color="green" delay={0.05} decimals={2} />
          <StatCard title="Total Orders"  rawValue={stats.totalOrders}  icon={<FaShoppingCart />} color="primary" delay={0.10} />
          <StatCard title="Products"       rawValue={stats.totalProducts} icon={<FaBoxOpen />}     color="purple"  delay={0.15} />
          <StatCard title="Users"          rawValue={stats.totalUsers}    icon={<FaUsers />}        color="blue"    delay={0.20} />
        </div>

        {/* Sales Chart */}
        <motion.div
          {...fadeUp(0.25)}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FaChartLine size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Revenue</h2>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Last {salesData.length} orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block" />
              Sales
            </div>
          </div>

          <div className="h-[300px]">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"   stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 'bold' }} tickLine={false} axisLine={false} width={60}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3}
                    fill="url(#colorSales)" dot={false}
                    activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <FaChartLine className="text-5xl text-gray-200 dark:text-gray-700 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-bold">No data yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Orders & Low Stock Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            {...fadeUp(0.30)}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Orders</h2>
              <Link to="/admin/orderlist" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                View all <FaExternalLinkAlt size={10} />
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              {recentOrders.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {["Order", "Customer", "Amount", "Status"].map((h) => (
                        <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {recentOrders.slice(0, 5).map((order) => {
                      const id = order.id || order._id;
                      const name = order.user?.name || order.user?.username || "Guest";
                      const initial = name[0]?.toUpperCase() || "U";
                      return (
                        <tr key={id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link to={`/order/${id}`} className="text-sm font-bold text-primary hover:underline">
                              #{id.toString().slice(-8)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                {initial}
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-gray-900 dark:text-white">
                              ${Number(order.total_price || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <OrderStatusBadge isPaid={order.is_paid} isDelivered={order.is_delivered} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FaShoppingCart className="text-5xl text-gray-200 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-bold">No orders yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            {...fadeUp(0.35)}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
                </span>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Low Stock</h2>
              </div>
              {lowStockProducts.length > 0 && (
                <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
                  {lowStockProducts.length} Items
                </span>
              )}
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[350px]">
              <AnimatePresence>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((p, i) => {
                    const stock = p.count_in_stock ?? p.countInStock ?? 0;
                    const crit = stock <= 2;
                    return (
                      <motion.div
                        key={p.id || p._id}
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-4 p-3 rounded-xl border ${
                          crit
                            ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                            : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20"
                        }`}
                      >
                        <img
                          src={getImageUrl(p.image)}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-white dark:bg-gray-900 shrink-0 shadow-sm"
                          onError={(e) => { e.target.src = "/images/placeholder.png"; }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className={`text-xs font-black mt-1 ${crit ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                            Only {stock} left
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-500 mb-4">
                      <FaCheckCircle size={24} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">All products well stocked</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 mt-auto">
              <Link to="/admin/productlist" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Manage inventory <FaExternalLinkAlt size={10} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Settings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Settings */}
          <motion.div
            {...fadeUp(0.40)}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <FaCog size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Store Settings</h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Global configuration</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <SettingsField
                label="Tax Rate" name="tax_rate" value={form.tax_rate}
                onChange={handleChange} step="0.0001" suffix="(0–1)"
                helper="Multiplier: 0.08 = 8%" disabled={saving}
              />
              <SettingsField
                label="Shipping Cost" name="shipping_cost" value={form.shipping_cost}
                onChange={handleChange} step="0.01" prefix="$"
                helper="Base rate for shipping" disabled={saving}
              />
              <SettingsField
                label="Free Shipping Threshold" name="free_shipping_threshold"
                value={form.free_shipping_threshold} onChange={handleChange}
                step="1" prefix="$" helper="Orders over this value ship free" disabled={saving}
              />

              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <FaReceipt className="text-primary" />
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Preview Calculation
                  </span>
                  <span className="ml-auto text-xs font-bold text-gray-500">on $250</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2"><FaTag size={12}/> Subtotal</span>
                    <span>${PREVIEW_SUB.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2"><FaPercent size={12}/> Tax</span>
                    <span>${prevTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2"><FaTruck size={12}/> Shipping</span>
                    <span className={prevShip === 0 ? "text-green-500" : ""}>{prevShip === 0 ? "FREE" : `$${prevShip.toFixed(2)}`}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="font-black text-gray-900 dark:text-white uppercase">Total</span>
                    <span className="text-lg font-black text-primary">${prevTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={saveSettings}
                  disabled={saving || !dirty}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? <><FaSpinner className="animate-spin" /> Saving…</> : <><FaSave /> Save Changes</>}
                </button>
                {dirty && !saving && (
                  <button
                    onClick={resetForm}
                    className="py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            {...fadeUp(0.46)}
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 content-start"
          >
            <QuickActionCard
              to="/admin/orderlist" icon={<FaShoppingCart />}
              title="Orders" description="Process and track customer orders"
              color="primary" badge={stats.totalOrders}
            />
            <QuickActionCard
              to="/admin/productlist" icon={<FaBoxOpen />}
              title="Products" description="Manage your store catalog"
              color="green" badge={stats.totalProducts}
            />
            <QuickActionCard
              to="/admin/users" icon={<FaUsers />}
              title="Users" description="Manage accounts and permissions"
              color="purple" badge={stats.totalUsers}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;