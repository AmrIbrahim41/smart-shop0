import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaSpinner, FaPlus, FaEdit, FaTrash,
    FaStore, FaExclamationTriangle, FaSave, FaTimes
} from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';
import Meta from '../../components/tapheader/Meta';

const CategoryListScreen = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/categories/');
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch categories error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to load categories';
            toast.error(errorMsg);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenModal = useCallback((mode, category = null) => {
        setModalMode(mode);
        setCurrentCategory(category);
        setFormData({
            name: category?.name || '',
            description: category?.description || '',
        });
        setShowModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }
        
        setSubmitting(true);
        
        try {
            if (modalMode === 'create') {
                await api.post('/api/categories/create/', formData);
                toast.success('Category created successfully!', {
                    icon: '✅',
                    duration: 2000,
                });
            } else {
                await api.put(`/api/categories/${currentCategory.id || currentCategory._id}/update/`, formData);
                toast.success('Category updated successfully!', {
                    icon: '✅',
                    duration: 2000,
                });
            }
            
            handleCloseModal();
            fetchCategories();
        } catch (error) {
            console.error('Submit category error:', error);
            const errorMsg = error.response?.data?.detail || 
                           error.response?.data?.name?.[0] ||
                           `Failed to ${modalMode} category`;
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    }, [formData, modalMode, currentCategory, handleCloseModal, fetchCategories]);

    const handleDeleteClick = useCallback((category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!categoryToDelete) return;

        setDeleting(categoryToDelete.id || categoryToDelete._id);
        setShowDeleteModal(false);

        try {
            await api.delete(`/api/categories/${categoryToDelete.id || categoryToDelete._id}/delete/`);
            
            toast.success('Category deleted successfully!', {
                icon: '🗑️',
                duration: 2000,
            });
            
            fetchCategories();
        } catch (error) {
            console.error('Delete category error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to delete category';
            toast.error(errorMsg);
        } finally {
            setDeleting(null);
            setCategoryToDelete(null);
        }
    }, [categoryToDelete, fetchCategories]);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-28">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12">
            <Meta title="Category Management - Admin" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            Category Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Organize and manage your product categories easily.
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
                    >
                        <FaPlus />
                        <span>Add Category</span>
                    </button>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 sm:p-6 mb-8"
                >
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search categories by name..."
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
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCategories.map((category, index) => {
                                const isDeleting = deleting === (category.id || category._id);

                                return (
                                    <motion.div
                                        key={category.id || category._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.05 * index }}
                                        className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 dark:border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                                            isDeleting ? 'opacity-50 pointer-events-none' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <FaStore className="text-2xl text-primary" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenModal('edit', category)}
                                                    className="p-2.5 bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                                                    title="Edit Category"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(category)}
                                                    disabled={isDeleting}
                                                    className="p-2.5 bg-gray-50 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    title="Delete Category"
                                                >
                                                    {isDeleting ? (
                                                        <FaSpinner className="animate-spin" />
                                                    ) : (
                                                        <FaTrash />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                            {category.name}
                                        </h3>
                                        
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-auto">
                                            {category.description || "No description provided."}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center max-w-2xl mx-auto mt-8"
                        >
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaStore className="text-4xl text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                No categories found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                {searchTerm 
                                    ? `We couldn't find any category matching "${searchTerm}". Try tweaking your search.` 
                                    : 'You haven\'t added any categories yet. Create your first category to organize your products.'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => handleOpenModal('create')}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <FaPlus />
                                    Add Your First Category
                                </button>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {modalMode === 'create' ? 'Create New Category' : 'Edit Category'}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all"
                                        placeholder="e.g., Electronics, Clothing..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white resize-none transition-all"
                                        placeholder="Brief description of what goes into this category..."
                                    />
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="w-full sm:w-1/2 px-4 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave />
                                                {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && categoryToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaExclamationTriangle className="text-4xl text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Delete Category?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{categoryToDelete.name}"</span>? 
                                This action cannot be undone, and products in this category will become uncategorized.
                            </p>
                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full sm:w-1/2 px-4 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95"
                                >
                                    <FaTrash />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CategoryListScreen;