import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { ENDPOINTS, getImageUrl } from '../../api';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaCheckCircle, 
  FaTimesCircle, FaClock, FaBoxOpen, FaTh, FaList, FaExclamationCircle 
} from 'react-icons/fa'; 
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' أو 'table'
  
  const { t } = useSettings();

  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(ENDPOINTS.MY_PRODUCTS);
      // التعديل هنا: تحديد مسار مصفوفة المنتجات من الرد
      setProducts(response.data.products || []); 
    } catch (err) {
      console.error("Fetch error:", err);
      setError(t('errorLoadingProducts') || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const deleteHandler = async (id) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/delete/${id}/`);
        setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
        toast.success(t('productDeleted') || "Product deleted successfully");
      } catch (err) {
        toast.error(t('deleteError') || "Error deleting product");
      }
    }
  };

  const StatusBadge = ({ status }) => {
      let icon, styleClass, label;
      switch(status) {
          case 'approved': 
              icon = <FaCheckCircle/>; 
              styleClass = 'text-green-700 bg-green-100 dark:bg-green-500/20 dark:text-green-400'; 
              label = 'Approved';
              break;
          case 'rejected': 
              icon = <FaTimesCircle/>; 
              styleClass = 'text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400'; 
              label = 'Rejected';
              break;
          default: 
              icon = <FaClock/>; 
              styleClass = 'text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-400'; 
              label = 'Pending';
      }
      return (
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider w-fit ${styleClass}`}>
              {icon} {t(status) || label}
          </span>
      );
  };

  if (loading) return (
      <div className="flex justify-center items-center min-h-screen pt-28 lg:pt-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
  );

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 animate-fade-in-up">
      <Meta title={t('sellerDashboard') || "Seller Dashboard"} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <FaBoxOpen className="text-primary" /> {t('sellerDashboard') || "Seller Dashboard"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('manageCatalog') || "Manage your catalog and stock"}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* View Toggle Buttons */}
                <div className="hidden sm:flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-white/5">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                        title="Grid View"
                    >
                        <FaTh />
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                        title="Table View"
                    >
                        <FaList />
                    </button>
                </div>

                <Link 
                    to="/seller/products/add"
                    className="flex-1 md:flex-none bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 flex justify-center items-center gap-2 transition-all transform hover:-translate-y-1"
                >
                    <FaPlus /> {t('createProduct') || "Add New Product"}
                </Link>
            </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-center font-bold flex items-center justify-center gap-2">
                <FaExclamationCircle /> {error}
            </div>
        )}

        {/* Empty State */}
        {!error && products.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[2.5rem] border border-dashed border-gray-300 dark:border-white/10 shadow-sm">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FaBoxOpen size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('noProductsAdded') || "No products yet"}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">{t('startAdding') || "Start adding products to your store now."}</p>
                <Link to="/seller/products/add" className="text-primary font-bold hover:underline">{t('startSelling') || "Start Selling"} &rarr;</Link>
            </div>
        )}

        {/* Content Area */}
        {products.length > 0 && (
            <>
                {/* Grid View (Default) */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            const stockCount = product.count_in_stock || product.countInStock || 0;
                            return (
                            <div key={product.id || product._id} className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-700 mb-4 border border-gray-100 dark:border-white/5">
                                    <img 
                                        src={getImageUrl(product.main_image || product.image)} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                                        loading="lazy"
                                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                    />
                                    <div className="absolute top-2 right-2 shadow-sm">
                                        <StatusBadge status={product.approval_status} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate flex-1 text-sm md:text-base" title={product.name}>
                                        {product.name}
                                    </h3>
                                    <span className="font-black text-primary text-sm md:text-base">${product.price}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-lg mt-auto">
                                    <span>{t('stock') || "Stock"}: <b className={stockCount > 0 ? 'text-green-500' : 'text-red-500'}>{stockCount}</b></span>
                                    <span className="truncate max-w-[80px]" title={product.brand}>{product.brand || "-"}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-auto">
                                    <Link to={`/product/${product.id || product._id}`} className="py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition flex justify-center items-center" title={t('view') || "View"}><FaEye/></Link>
                                    <Link to={`/seller/product/${product.id || product._id}/edit`} className="py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex justify-center items-center" title={t('edit') || "Edit"}><FaEdit/></Link>
                                    <button onClick={() => deleteHandler(product.id || product._id)} className="py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition flex justify-center items-center" title={t('delete') || "Delete"}><FaTrash/></button>
                                </div>
                            </div>
                        )})}
                    </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-500 dark:text-gray-400 text-sm">
                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="p-5 pl-6">{t('product') || "Product"}</th>
                                        <th className="p-5">{t('price') || "Price"}</th>
                                        <th className="p-5">{t('stock') || "Stock"}</th>
                                        <th className="p-5">{t('status') || "Status"}</th>
                                        <th className="p-5 text-right pr-6">{t('actions') || "Actions"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {products.map((product) => {
                                        const stockCount = product.count_in_stock || product.countInStock || 0;
                                        return (
                                        <tr key={product.id || product._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition duration-200">
                                            <td className="p-5 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 flex-shrink-0">
                                                        <img 
                                                            src={getImageUrl(product.main_image || product.image)} 
                                                            alt={product.name} 
                                                            className="w-full h-full object-cover" 
                                                            loading="lazy"
                                                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-xs" title={product.name}>
                                                            {product.name}
                                                        </span>
                                                        {product.brand && <span className="text-xs text-gray-400">{product.brand}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-primary text-base">${product.price}</td>
                                            <td className="p-5">
                                                <span className={`font-bold ${stockCount > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {stockCount}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <StatusBadge status={product.approval_status} />
                                            </td>
                                            <td className="p-5 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/product/${product.id || product._id}`} className="p-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition" title={t('view') || "View"}>
                                                        <FaEye />
                                                    </Link>
                                                    <Link to={`/seller/product/${product.id || product._id}/edit`} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition" title={t('edit') || "Edit"}>
                                                        <FaEdit />
                                                    </Link>
                                                    <button onClick={() => deleteHandler(product.id || product._id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition" title={t('delete') || "Delete"}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;