import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaSpinner, FaPlus, FaEdit, FaTrash, FaFilter,
    FaBox, FaCheckCircle, FaTimes, FaExclamationTriangle,
    FaTh, FaList, FaUserTie, FaStar, FaTags, FaCalendarAlt, FaHashtag
} from 'react-icons/fa';
import api, { getImageUrl } from '../../api';
import toast from 'react-hot-toast';
import Meta from '../../components/tapheader/Meta';
import Paginate from '../../components/paginate/Paginate';

const ProductListScreen = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // حالات الفلتر
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStock, setFilterStock] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleting, setDeleting] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('grid');

    // 1. تأخير البحث (Debounce) حتى لا نرهق السيرفر
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // تأخير نصف ثانية
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // 2. إعادة الصفحة للأولى عند تغيير أي فلتر لتجنب صفحات فارغة
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, filterCategory, filterStock]);

    // 3. جلب المنتجات من السيرفر بناءً على الفلاتر
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // تجهيز الرابط مع المتغيرات
            let url = `/api/products/?page=${currentPage}`;
            if (debouncedSearchTerm) url += `&keyword=${debouncedSearchTerm}`;
            if (filterCategory !== 'all') url += `&category=${filterCategory}`;
            if (filterStock !== 'all') url += `&stock_status=${filterStock}`;

            const { data } = await api.get(url);
            
            if (Array.isArray(data)) {
                setProducts(data);
                setTotalPages(1);
            } else if (data.products) {
                setProducts(data.products);
                setCurrentPage(data.page || 1);
                setTotalPages(data.pages || 1);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Fetch products error:', error);
            toast.error(error.response?.data?.detail || 'Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, filterCategory, filterStock]);

    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await api.get('/api/categories/');
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    }, []);

    // تحميل البيانات الأولية
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDeleteClick = useCallback((product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!productToDelete) return;
        const productId = productToDelete._id || productToDelete.id;
        setDeleting(productId);
        setShowDeleteModal(false);

        try {
            await api.delete(`/api/products/delete/${productId}/`);
            toast.success('Product deleted successfully!', { icon: '🗑️' });
            fetchProducts();
        } catch (error) {
            console.error('Delete product error:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete product');
        } finally {
            setDeleting(null);
            setProductToDelete(null);
        }
    }, [productToDelete, fetchProducts]);

    const handleStatusChange = async (productId, newStatus) => {
        setUpdatingStatus(productId);
        try {
            const formData = new FormData();
            formData.append('approval_status', newStatus);

            await api.put(`/api/products/update/${productId}/`, formData);
            
            toast.success(`Status updated to ${newStatus}`);
            setProducts(prevProducts => 
                prevProducts.map(p => 
                    (p._id || p.id) === productId ? { ...p, approval_status: newStatus } : p
                )
            );
        } catch (error) {
            console.error('Update status error:', error);
            toast.error(error.response?.data?.detail || 'Failed to update status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCreateProduct = useCallback(() => navigate('/admin/product/create'), [navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12">
            <Meta title="Product Management - Admin" />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Product Management</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Oversee your catalog, approve vendor products, and manage stock levels.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-white/5">
                            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><FaTh className="text-lg" /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><FaList className="text-lg" /></button>
                        </div>
                        <button onClick={handleCreateProduct} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"><FaPlus /> Add Product</button>
                    </div>
                </motion.div>

                {/* Search & Filters */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 md:p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search products by name or brand..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium" 
                            />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all ${showFilters ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <FaFilter /> Filters
                        </button>
                    </div>

                    {/* Filter Dropdowns UI */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium cursor-pointer"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Stock Status</label>
                                    <select
                                        value={filterStock}
                                        onChange={(e) => setFilterStock(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium cursor-pointer"
                                    >
                                        <option value="all">All Stock Status</option>
                                        <option value="in-stock">In Stock (&gt; 5)</option>
                                        <option value="low-stock">Low Stock (1 - 5)</option>
                                        <option value="out-of-stock">Out of Stock (0)</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium tracking-wider animate-pulse">Loading amazing products...</p>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        {/* 1. Grid View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {products.map((product, index) => {
                                    const productId = product._id || product.id;
                                    const stock = product.count_in_stock || product.countInStock || 0;
                                    const isDeleting = deleting === productId;
                                    const isUpdating = updatingStatus === productId;

                                    return (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={productId} className={`bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/50 mb-5 flex items-center justify-center p-4">
                                                <img src={getImageUrl(product.image || product.main_image)} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }} />
                                                <div className="absolute top-3 left-3"><StockBadge stock={stock} /></div>
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                    <span className="flex items-center gap-1"><FaHashtag /> {productId.toString().slice(-6)}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><FaCalendarAlt /> {formatDate(product.created_at)}</span>
                                                </div>

                                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-2" title={product.name}>{product.name}</h3>
                                                
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium truncate max-w-[60%]"><FaTags className="text-gray-400 shrink-0" /> <span className="truncate">{product.category_name || 'Uncategorized'}</span></p>
                                                    <div className="flex items-center gap-1 text-yellow-400 text-sm shrink-0">
                                                        <FaStar /><span className="font-bold text-gray-700 dark:text-gray-300 text-xs">{Number(product.rating || 0).toFixed(1)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between mb-5 mt-auto gap-2">
                                                    <div className="shrink-0">
                                                        <span className="font-black text-primary text-xl">${Number(product.final_price || product.price || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 max-w-[120px]" title={product.user_name || 'Admin'}>
                                                        <FaUserTie className="text-gray-400 shrink-0" /> 
                                                        <span className="truncate">{product.user_name || 'Admin'}</span>
                                                    </div>
                                                </div>

                                                <div className="mb-5">
                                                    <StatusSelect status={product.approval_status} onChange={(newStatus) => handleStatusChange(productId, newStatus)} disabled={isUpdating || isDeleting} />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Link to={`/admin/product/${productId}/edit`} className="py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors flex justify-center items-center gap-2 border border-gray-200 dark:border-white/5"><FaEdit/> Edit</Link>
                                                    <button onClick={() => handleDeleteClick(product)} disabled={isDeleting} className="py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-red-50 hover:text-red-600 transition-colors flex justify-center items-center gap-2 border border-gray-200 dark:border-white/5 disabled:opacity-50">
                                                        {isDeleting ? <FaSpinner className="animate-spin" /> : <><FaTrash/> Delete</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 2. List View */}
                        {viewMode === 'list' && (
                            <div className="flex flex-col gap-4 mb-8">
                                {products.map((product, index) => {
                                    const productId = product._id || product.id;
                                    const stock = product.count_in_stock || product.countInStock || 0;
                                    const isDeleting = deleting === productId;
                                    const isUpdating = updatingStatus === productId;

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }} 
                                            animate={{ opacity: 1, x: 0 }} 
                                            transition={{ delay: index * 0.05 }}
                                            key={productId} 
                                            className={`bg-white dark:bg-gray-800 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 ${isDeleting ? 'opacity-50' : ''}`}
                                        >
                                            <div className="w-full lg:w-32 h-32 rounded-xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-2 shrink-0 relative">
                                                <img src={getImageUrl(product.image || product.main_image)} alt={product.name} className="max-w-full max-h-full object-contain" onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }} />
                                                <div className="absolute -top-2 -right-2 lg:hidden"><StockBadge stock={stock} /></div>
                                            </div>

                                            <div className="flex-1 min-w-0 w-full">
                                                <div className="flex items-center gap-3 mb-1 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                    <span className="flex items-center gap-1"><FaHashtag /> {productId.toString().slice(-6)}</span>
                                                    <span className="hidden lg:inline">•</span>
                                                    <span className="hidden lg:flex items-center gap-1"><FaCalendarAlt /> {formatDate(product.created_at)}</span>
                                                    {product.brand && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-primary">{product.brand}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-2" title={product.name}>{product.name}</h3>
                                                
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md"><FaTags className="text-gray-400" /> {product.category_name || 'Uncategorized'}</span>
                                                    <span className="flex items-center gap-1.5"><FaStar className="text-yellow-400"/> {Number(product.rating || 0).toFixed(1)} ({product.num_reviews})</span>
                                                    <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md max-w-[150px]" title={product.user_name || 'Admin'}>
                                                        <FaUserTie className="shrink-0"/> <span className="truncate">{product.user_name || 'Admin'}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                                                <div className="text-left lg:text-right">
                                                    <p className="text-sm text-gray-500 mb-1 hidden lg:block">Price</p>
                                                    <span className="font-black text-primary text-2xl">${Number(product.final_price || product.price || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="hidden lg:block"><StockBadge stock={stock} /></div>
                                            </div>

                                            <div className="flex flex-col gap-3 w-full lg:w-48 shrink-0">
                                                <StatusSelect status={product.approval_status} onChange={(newStatus) => handleStatusChange(productId, newStatus)} disabled={isUpdating || isDeleting} />
                                                <div className="flex gap-2">
                                                    <Link to={`/admin/product/${productId}/edit`} className="flex-1 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 flex justify-center items-center transition-colors"><FaEdit /></Link>
                                                    <button onClick={() => handleDeleteClick(product)} disabled={isDeleting} className="flex-1 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 flex justify-center items-center transition-colors disabled:opacity-50">
                                                        {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <Paginate page={currentPage} pages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6"><FaBox className="text-5xl text-gray-300 dark:text-gray-600" /></div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No products found</h3>
                        <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">Try adjusting your search terms or add a new product to your catalog.</p>
                        <button onClick={handleCreateProduct} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-1"><FaPlus /> Add New Product</button>
                    </motion.div>
                )}
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
                            <h3 className="text-xl font-bold mb-4 dark:text-white">Confirm Deletion</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{productToDelete?.name}</span>? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                                <button onClick={handleDeleteConfirm} className="px-5 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2">
                                    {deleting ? <FaSpinner className="animate-spin" /> : <><FaTrash /> Delete</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Status Select Component
const StatusSelect = ({ status, onChange, disabled }) => {
    let styleClasses = '';
    switch(status) {
        case 'approved': styleClasses = 'bg-green-50/80 border-green-200 text-green-700 focus:ring-green-500/50 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400'; break;
        case 'rejected': styleClasses = 'bg-red-50/80 border-red-200 text-red-700 focus:ring-red-500/50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'; break;
        default: styleClasses = 'bg-yellow-50/80 border-yellow-200 text-yellow-700 focus:ring-yellow-500/50 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400';
    }

    return (
        <div className="relative w-full group">
            <select value={status || 'pending'} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border text-sm font-bold shadow-sm focus:outline-none focus:ring-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${styleClasses}`}>
                <option value="pending" className="font-bold text-gray-900">⏳ Pending</option>
                <option value="approved" className="font-bold text-gray-900">✅ Approved</option>
                <option value="rejected" className="font-bold text-gray-900">❌ Rejected</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {disabled ? <FaSpinner className="animate-spin text-current opacity-70" /> : <svg className="w-4 h-4 text-current opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
            </div>
        </div>
    );
};

// Stock Badge Component 
const StockBadge = ({ stock }) => {
    if (stock === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-100/90 backdrop-blur-sm text-red-700 shadow-sm border border-red-200/50"><FaTimes className="text-[12px]"/> Out of Stock</span>;
    if (stock <= 5) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-100/90 backdrop-blur-sm text-yellow-700 shadow-sm border border-yellow-200/50"><FaExclamationTriangle className="text-[12px]"/> {stock} Left</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-100/90 backdrop-blur-sm text-green-700 shadow-sm border border-green-200/50"><FaCheckCircle className="text-[12px]"/> In Stock</span>;
};

export default ProductListScreen;