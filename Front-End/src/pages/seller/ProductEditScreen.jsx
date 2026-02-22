import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaArrowLeft, FaSave, FaCloudUploadAlt, FaTrash, FaTimes,
    FaImage, FaSpinner, FaTag, FaDollarSign,
    FaBoxOpen, FaPlus, FaInfoCircle, FaCheck
} from 'react-icons/fa';
import api, { getImageUrl } from '../../api';
import toast from 'react-hot-toast';
import Meta from '../../components/tapheader/Meta';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const ProductEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const mainImageInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        discount_price: '',
        brand: '',
        count_in_stock: '',
        category: '',
        description: '',
    });

    // Images
    const [mainImage, setMainImage] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState('');
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [existingGallery, setExistingGallery] = useState([]);

    // Tags & Categories
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [categories, setCategories] = useState([]);

    // UI State
    const [loading, setLoading] = useState(!!id);
    const [submitting, setSubmitting] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const { data } = await api.get('/api/categories/');
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load categories');
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/api/products/${id}/`);
            setFormData({
                name: data.name || '',
                price: data.price || '',
                discount_price: data.discount_price || '',
                brand: data.brand || '',
                count_in_stock: data.count_in_stock || '',
                category: data.category?.id || data.category || '',
                description: data.description || '',
            });

            if (data.image) setMainImagePreview(getImageUrl(data.image));
            
            // إصلاح المشكلة: قراءة المصفوفة الصحيحة 'images' من الـ API بدلاً من 'gallery_images'
            if (data.images && Array.isArray(data.images)) {
                setExistingGallery(data.images);
            }
            
            if (data.tags && Array.isArray(data.tags)) {
                setTags(data.tags.map(t => typeof t === 'object' ? t.name : t));
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to load product details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCategories();
        fetchProduct();
    }, [fetchCategories, fetchProduct]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleMainImageChange = useCallback((file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Please select a valid image file');
        if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be less than 5MB');

        setMainImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setMainImagePreview(reader.result);
        reader.readAsDataURL(file);
    }, []);

    const handleGalleryImagesChange = useCallback((files) => {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not a valid image`); return false; }
            if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (Max 5MB)`); return false; }
            return true;
        });

        if (validFiles.length === 0) return;
        setGalleryImages(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
        
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    }, []);

    const removeGalleryImage = useCallback((index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    }, []);

    // إضافة وظيفة الحذف الفعلي للصور المحفوظة مسبقاً
    const removeExistingGalleryImage = useCallback(async (index, imageId) => {
        if (window.confirm('Are you sure you want to permanently delete this image from the gallery?')) {
            try {
                if (imageId) {
                    await api.delete(`/api/products/delete-image/${imageId}/`);
                }
                setExistingGallery(prev => prev.filter((_, i) => i !== index));
                toast.success('Image deleted successfully');
            } catch (error) {
                toast.error('Failed to delete image from server');
            }
        }
    }, []);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length === 1) handleMainImageChange(files[0]);
        else if (files.length > 1) handleGalleryImagesChange(files);
    }, [handleMainImageChange, handleGalleryImagesChange]);

    const handleAddTag = useCallback((e) => {
        e.preventDefault();
        if (tagInput.trim()) {
            const newTag = tagInput.trim();
            if (!tags.includes(newTag)) {
                setTags(prev => [...prev, newTag]);
                setTagInput('');
            } else {
                toast.error('This tag is already added');
            }
        }
    }, [tagInput, tags]);

    const handleTagInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(e);
        }
    }, [handleAddTag]);

    const removeTag = useCallback((tagToRemove) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Product name is required');
        if (!formData.price || Number(formData.price) <= 0) return toast.error('A valid price is required');
        if (!formData.category) return toast.error('Please select a product category');
        if (!formData.count_in_stock || Number(formData.count_in_stock) < 0) return toast.error('Valid stock quantity is required');
        if (!id && !mainImage && !mainImagePreview) return toast.error('Main product image is required');

        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key] || (key === 'discount_price' ? 0 : '')));
            if (mainImage) formDataToSend.append('image', mainImage);
            galleryImages.forEach(file => formDataToSend.append(`images`, file));
            formDataToSend.append('tags', JSON.stringify(tags));

            if (id) {
                await api.put(`/api/products/update/${id}/`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Product updated successfully!');
            } else {
                await api.post('/api/products/create/', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Product created successfully!');
            }
            handleGoBack();
        } catch (error) {
            toast.error(error.response?.data?.detail || `Failed to ${id ? 'update' : 'create'} product`);
        } finally {
            setSubmitting(false);
        }
    }, [formData, mainImage, mainImagePreview, galleryImages, tags, id]);

    const handleGoBack = useCallback(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        navigate(userInfo.is_admin ? '/admin/productlist' : '/dashboard');
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen pt-28 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <FaSpinner className="text-5xl text-blue-600 dark:text-blue-400 mb-4" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading product details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 lg:pt-32 pb-10 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 selection:bg-blue-200 dark:selection:bg-blue-900">
            <Meta title={id ? 'Edit Product | Smart Shop' : 'Create Product | Smart Shop'} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleGoBack}
                            aria-label="Go back"
                            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                        >
                            <FaArrowLeft className="text-gray-600 dark:text-gray-300 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {id ? 'Edit Product Details' : 'Create New Product'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {id ? 'Update information, pricing, and media for this item.' : 'Fill in the details below to add a new item to your store.'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-8 items-start">
                    
                    {/* LEFT COLUMN: Main Information & Media */}
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-8">
                        
                        {/* Basic Info Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 sm:p-8 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-3xl"></div>
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><FaInfoCircle className="text-blue-500" /></span> 
                                    Basic Information
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-12">Main details that customers will see first.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="group">
                                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600">Product Title <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        placeholder="e.g., Sony WH-1000XM5 Wireless Headphones"
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600">Full Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-y"
                                        placeholder="Highlight the key features, specifications, and benefits..."
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="brand" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600">Brand / Manufacturer</label>
                                    <input
                                        id="brand"
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        placeholder="e.g., Apple, Samsung, Nike"
                                    />
                                </div>
                            </div>
                        </motion.section>

                        {/* Media Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 sm:p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-3xl"></div>
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><FaImage className="text-indigo-500" /></span> 
                                    Product Media
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-12">Upload high-quality images to showcase your product.</p>
                            </div>
                            
                            {/* Main Image Dropzone */}
                            <div className="mb-8 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Primary Display Image <span className="text-red-500">*</span></label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => mainImageInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] ${
                                        isDragging 
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {mainImagePreview ? (
                                            <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative group w-full flex justify-center">
                                                <img src={mainImagePreview} alt="Main preview" className="max-h-64 object-contain rounded-xl shadow-md bg-white dark:bg-gray-800 p-2" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                    <p className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/50 rounded-lg border border-white/20">
                                                        <FaImage /> Click to Change Image
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="upload-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center space-y-4">
                                                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-500">
                                                    <FaCloudUploadAlt className="text-4xl" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-semibold text-gray-900 dark:text-white">Click to upload or drag & drop</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Recommended: Square image (1:1), PNG or WEBP.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input ref={mainImageInputRef} type="file" accept="image/*" onChange={(e) => handleMainImageChange(e.target.files[0])} className="hidden" />
                                </div>
                            </div>

                            {/* Gallery Images */}
                            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Additional Image Gallery (Optional)</label>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="w-full py-4 px-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-700 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <FaPlus className="text-indigo-500" /> Upload More Angles/Details
                                </button>
                                <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={(e) => handleGalleryImagesChange(e.target.files)} className="hidden" />

                                {(existingGallery.length > 0 || galleryPreviews.length > 0) && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                                        <AnimatePresence>
                                            {existingGallery.map((img, index) => (
                                                <motion.div 
                                                    key={`existing-${img.id || index}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                                    className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"
                                                >
                                                    <img src={getImageUrl(img.image || img)} alt={`Gallery item`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                    <button 
                                                        type="button" 
                                                        title="Delete this image permanently"
                                                        onClick={() => removeExistingGalleryImage(index, img.id)} 
                                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                            
                                            {galleryPreviews.map((preview, index) => (
                                                <motion.div 
                                                    key={`new-${index}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                                    className="relative group aspect-square rounded-xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-600 shadow-sm bg-white dark:bg-gray-800"
                                                >
                                                    <div className="absolute top-1 left-1 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-md z-10 font-bold tracking-wider shadow-sm">NEW</div>
                                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                    <button 
                                                        type="button" 
                                                        title="Remove before saving"
                                                        onClick={() => removeGalleryImage(index)} 
                                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0 z-10"
                                                    >
                                                        <FaTimes className="text-sm" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </motion.div>

                    {/* RIGHT COLUMN: Settings, Organization & Actions */}
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-8 lg:mt-0 space-y-8">
                        
                        {/* Pricing Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-3xl"></div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
                                <span className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg"><FaDollarSign className="text-green-500" /></span> 
                                Pricing Settings
                            </h2>
                            <div className="space-y-5">
                                <div className="group">
                                    <label htmlFor="price" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-green-600">Base Price <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-bold">$</span>
                                        </div>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required min="0.01" step="0.01"
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-sm font-bold text-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="discount_price" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-green-600">Sale/Discounted Price</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-bold">$</span>
                                        </div>
                                        <input
                                            id="discount_price"
                                            type="number"
                                            name="discount_price"
                                            value={formData.discount_price}
                                            onChange={handleChange}
                                            min="0" step="0.01"
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-sm font-bold text-lg"
                                            placeholder="Leave empty if no sale"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Inventory Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-3xl"></div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
                                <span className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><FaBoxOpen className="text-orange-500" /></span> 
                                Inventory Management
                            </h2>
                            <div className="group">
                                <label htmlFor="count_in_stock" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-orange-600">Available Stock <span className="text-red-500">*</span></label>
                                <input
                                    id="count_in_stock"
                                    type="number"
                                    name="count_in_stock"
                                    value={formData.count_in_stock}
                                    onChange={handleChange}
                                    required min="0"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm font-bold text-lg"
                                    placeholder="0 units"
                                />
                            </div>
                        </motion.section>

                        {/* Organization & Tags Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-3xl"></div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
                                <span className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><FaTag className="text-purple-500" /></span> 
                                Classification
                            </h2>
                            <div className="space-y-6">
                                <div className="group">
                                    <label htmlFor="category" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-purple-600">Main Category <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required disabled={categoriesLoading}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm disabled:opacity-50 appearance-none cursor-pointer font-medium"
                                        >
                                            <option value="" disabled>-- Select a category --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label htmlFor="tags" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-purple-600">
                                        Search Tags
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add keywords to help customers find this product.</p>
                                    
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            id="tags"
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagInputKeyDown}
                                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm"
                                            placeholder="Type a tag..."
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleAddTag}
                                            disabled={!tagInput.trim()}
                                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                                        <AnimatePresence>
                                            {tags.length === 0 && (
                                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-gray-400 w-full text-center my-auto italic">
                                                    No tags added yet.
                                                </motion.span>
                                            )}
                                            {tags.map((tag, index) => (
                                                <motion.span 
                                                    key={`${tag}-${index}`}
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                                                    layout
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-bold shadow-sm group hover:border-red-300 dark:hover:border-red-800 transition-colors"
                                                >
                                                    #{tag}
                                                    <button 
                                                        type="button" 
                                                        aria-label={`Remove tag ${tag}`} 
                                                        onClick={() => removeTag(tag)} 
                                                        className="text-purple-400 hover:text-red-500 focus:outline-none bg-purple-50 hover:bg-red-50 dark:bg-purple-900/20 dark:hover:bg-red-900/30 rounded-md p-1 transition-colors"
                                                    >
                                                        <FaTimes className="text-[12px]" />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Sticky Action Buttons */}
                        <motion.div variants={itemVariants} className="sticky top-28 flex flex-col gap-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md p-4 -mx-4 sm:mx-0 rounded-2xl sm:p-0 sm:bg-transparent z-20 border-t border-gray-200 dark:border-gray-800 sm:border-0">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full relative flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 overflow-hidden"
                            >
                                <AnimatePresence mode="wait">
                                    {submitting ? (
                                        <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                                            <FaSpinner className="animate-spin" /> Saving Data...
                                        </motion.div>
                                    ) : (
                                        <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                                            {id ? <FaCheck /> : <FaSave />}
                                            {id ? 'Save All Changes' : 'Publish Product'}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {!submitting && <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>}
                            </button>
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="w-full py-4 px-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 focus:outline-none"
                            >
                                Cancel & Return
                            </button>
                        </motion.div>
                    </motion.div>
                </form>
            </div>
            
            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default ProductEditScreen;