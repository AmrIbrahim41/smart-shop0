import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { ENDPOINTS, getImageUrl } from '../../api';
import { FaEdit, FaTrash, FaPlus, FaBoxOpen, FaExclamationCircle } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const MyProducts = () => {
  // --- State Management ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  
  const { t } = useSettings();

  // --- Fetch Data ---
  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(ENDPOINTS.MY_PRODUCTS);
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products", err);
      setError(t('fetchError') || "Failed to load your products.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  // --- Delete Handler ---
  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete') || "Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/api/products/delete/${id}/`);
        
        setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
        alert(t('productDeleted') || "Product deleted successfully");
        
      } catch (error) {
        alert(t('deleteError') || "Error deleting product");
      }
    }
  };

  const StatusBadge = ({ status }) => {
      let styles = '';
      let icon = null;

      switch(status) {
          case 'approved':
              styles = 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
              break;
          case 'rejected':
              styles = 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
              break;
          default: 
              styles = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400';
      }

      return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 w-fit ${styles}`}>
              {t(status) || status}
          </span>
      );
  };

  // --- Render ---
  if (loading) return (
      <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
  );

  return (
    <div className="animate-fade-in-up">
      <Meta title={t('myProducts') || "My Products"} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <FaBoxOpen className="text-primary" /> {t('myProducts') || "My Products"}
        </h2>
        <Link 
            to="/seller/products/add" 
            className="w-full sm:w-auto bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
            <FaPlus /> {t('addNew') || "Create Product"}
        </Link>
      </div>

      {/* Error State */}
      {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-center font-bold flex items-center justify-center gap-2">
              <FaExclamationCircle /> {error}
          </div>
      )}

      {/* Content */}
      {products.length === 0 && !error ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-20 bg-white dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FaBoxOpen size={24} />
            </div>
            <p className="font-medium">{t('noProductsAdded') || "You haven't added any products yet."}</p>
            <Link to="/seller/products/add" className="text-primary font-bold mt-2 inline-block hover:underline">Start Selling</Link>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-dark-accent rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
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
                {products.map((product) => (
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
                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-xs" title={product.name}>
                                {product.name}
                            </span>
                        </div>
                    </td>
                    <td className="p-5 font-black text-primary text-base">${product.price}</td>
                    <td className="p-5 text-gray-900 dark:text-white font-medium">{product.countInStock || product.stock}</td>
                    <td className="p-5">
                        <StatusBadge status={product.approval_status} />
                    </td>
                    <td className="p-5 text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                            <Link 
                                to={`/seller/product/${product.id || product._id}/edit`} 
                                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                title={t('edit')}
                            >
                                <FaEdit />
                            </Link>
                            <button 
                                onClick={() => handleDelete(product.id || product._id)} 
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                title={t('delete')}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;