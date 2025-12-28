import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../api';
import { FaEdit, FaTrash, FaUser, FaCheckCircle, FaExclamationCircle, FaBan, FaPlus } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const ProductListScreen = () => {
    // --- State Management ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { t } = useSettings();
    
    const userInfo = localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo')) 
        : null;

    // --- 1. Fetching Logic---
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/api/products/');
            setProducts(Array.isArray(data) ? data : data.products || []);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError(err.response?.data?.detail || err.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            fetchProducts();
        } else {
            navigate('/login');
        }
    }, [navigate, fetchProducts]); 

    // --- 2. Delete Handler ---
    const deleteHandler = async (id) => {
        if (window.confirm(t('confirmDeleteProduct') || 'Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/api/products/delete/${id}/`);
                
                setProducts((prevProducts) => prevProducts.filter(p => p.id !== id && p._id !== id));
                
                alert(t('productDeleted') || "Product Deleted!");
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.response?.data?.detail || "Error deleting product");
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-dark transition-colors duration-300">
            <Meta title={t('productList') || "PRODUCTS LIST"} />

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase text-center sm:text-left tracking-tight">
                        {t('allProducts') || "ALL PRODUCTS (ADMIN)"}
                        {!loading && <span className="ml-2 text-sm text-gray-500 font-medium">({products.length})</span>}
                    </h1>
                    <button 
                        onClick={() => navigate('/admin/product/create')}
                        className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm flex items-center justify-center gap-2"
                    >
                        <FaPlus /> Create Product
                    </button>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-bold border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        No products found. Start adding some!
                    </div>
                ) : (
                    <>
                        {/* 1. Mobile View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {products.map((product) => (
                                <div key={product.id || product._id} className="bg-white dark:bg-dark-accent p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img
                                            src={getImageUrl(product.image)}
                                            alt={product.name}
                                            className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-white/10 bg-gray-50"
                                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{product.name}</h3>
                                            <p className="text-primary font-black mt-1">${product.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Status</span>
                                            <StatusBadge status={product.approval_status} />
                                        </div>
                                        <div className="flex gap-2">
                                            <ActionButton 
                                                onClick={() => navigate(`/admin/product/${product.id || product._id}/edit`)} 
                                                icon={<FaEdit size={16} />} 
                                                colorClass="text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100" 
                                            />
                                            <ActionButton 
                                                onClick={() => deleteHandler(product.id || product._id)} 
                                                icon={<FaTrash size={16} />} 
                                                colorClass="text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2. Desktop View */}
                        <div className="hidden md:block bg-white dark:bg-dark-accent rounded-3xl border border-gray-100 dark:border-white/5 shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                                            <th className="p-5 text-center">ID</th>
                                            <th className="p-5 text-center">{t('image') || "Image"}</th>
                                            <th className="p-5">{t('name') || "Product Name"}</th>
                                            <th className="p-5">{t('price') || "Price"}</th>
                                            <th className="p-5">{t('seller') || "Seller"}</th>
                                            <th className="p-5 text-center">{t('status') || "Status"}</th>
                                            <th className="p-5 text-center">{t('actions') || "Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {products.map((product) => (
                                            <tr key={product.id || product._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition duration-200">
                                                <td className="p-5 text-center text-xs text-gray-400">#{(product.id || product._id).toString().substring(0,6)}</td>
                                                <td className="p-5">
                                                    <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50">
                                                        <img
                                                            src={getImageUrl(product.image)}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover hover:scale-110 transition duration-300"
                                                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-5 font-bold text-gray-900 dark:text-white truncate max-w-[200px]" title={product.name}>
                                                    {product.name}
                                                </td>
                                                <td className="p-5 text-primary font-black">${product.price}</td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                                                            <FaUser className="text-gray-500 dark:text-gray-400" size={10} />
                                                        </div>
                                                        <span className="truncate max-w-[120px] text-xs font-bold">{product.user_name || product.user || 'Admin'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex justify-center">
                                                        <StatusBadge status={product.approval_status} />
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <ActionButton 
                                                            onClick={() => navigate(`/admin/product/${product.id || product._id}/edit`)} 
                                                            icon={<FaEdit size={14} />} 
                                                            colorClass="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20" 
                                                        />
                                                        <ActionButton 
                                                            onClick={() => deleteHandler(product.id || product._id)} 
                                                            icon={<FaTrash size={14} />} 
                                                            colorClass="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20" 
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    switch (status) {
        case 'approved': 
            return <span className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-500/20 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase"><FaCheckCircle /> Approved</span>;
        case 'rejected': 
            return <span className="flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-500/20 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase"><FaBan /> Rejected</span>;
        default: 
            return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase"><FaExclamationCircle /> Pending</span>;
    }
};

const ActionButton = ({ onClick, icon, colorClass }) => (
    <button 
        onClick={onClick} 
        className={`p-2 rounded-lg transition-all duration-200 ${colorClass}`}
    >
        {icon}
    </button>
);

export default ProductListScreen;