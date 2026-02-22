import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { apiService, getImageUrl } from '../../api';
import {
    FaShoppingCart, FaArrowLeft, FaHeart, FaRegHeart, FaPlus, FaMinus,
    FaStar, FaEdit, FaUserCircle, FaFire, FaCheckCircle, FaShare, FaTruck,
    FaShieldAlt, FaUndo, FaTrash
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import Rating from '../../components/rating/Rating';
import Meta from '../../components/tapheader/Meta';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { t } = useSettings();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qty, setQty] = useState(1);
    const [displayImage, setDisplayImage] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);

    // Reviews State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // UI State للتعليقات
    const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);

    const userInfo = useMemo(() => {
        try {
            const stored = localStorage.getItem('userInfo');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: currentProduct } = await apiService.getProductDetails(id);
            setProduct(currentProduct);
            setDisplayImage(currentProduct.image || currentProduct.main_image);

            // جلب المنتجات المرتبطة
            if (currentProduct.category) {
                try {
                    const { data: responseData } = await api.get(`/api/products/?category=${currentProduct.category}`);
                    const productsList = responseData.products || responseData || [];
                    const related = productsList.filter((p) => 
                        String(p.id || p._id) !== String(currentProduct.id || currentProduct._id)
                    );
                    setRelatedProducts(related.slice(0, 4));
                } catch (relError) {
                    console.error("Error fetching related products:", relError);
                }
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            const errorMsg = error.response?.data?.detail || "Product not found";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchProduct]);

    const stockCount = product?.count_in_stock || product?.countInStock || 0;
    const finalPrice = product?.finalPrice || product?.discount_price || product?.price || 0;
    const hasDiscount = finalPrice < (product?.price || 0);

    const increaseQty = useCallback(() => {
        const existItem = cartItems.find((x) => String(x.product) === String(product.id || product._id));
        const quantityInCart = existItem ? existItem.qty : 0;

        if (quantityInCart + qty < stockCount) {
            setQty(prev => prev + 1);
        } else {
            toast.error(t('maxLimitReached') || "Maximum quantity reached", { duration: 2000 });
        }
    }, [qty, stockCount, cartItems, product, t]);

    const decreaseQty = useCallback(() => {
        if (qty > 1) setQty(prev => prev - 1);
    }, [qty]);

    const addToCartHandler = useCallback(() => {
        if (!userInfo) {
            toast.error('Please login to add items to cart', { icon: '🔒' });
            navigate(`/login?redirect=product/${id}`);
            return;
        }

        if (stockCount === 0) {
            toast.error('Product is out of stock');
            return;
        }

        const existItem = cartItems.find((x) => String(x.product) === String(product.id || product._id));
        const quantityInCart = existItem ? existItem.qty : 0;

        if (quantityInCart + qty > stockCount) {
            toast.error(t('maxLimitReached') || "Maximum quantity reached");
            return;
        }

        addToCart(product, qty);
        toast.success('Added to cart successfully!', { icon: '🛒' });
    }, [userInfo, stockCount, cartItems, product, qty, addToCart, navigate, id, t]);

    // Review Handlers
    const userReview = useMemo(() => {
        return product?.reviews?.find(r => String(r.user) === String(userInfo?.id) || String(r.user_id) === String(userInfo?.id));
    }, [product?.reviews, userInfo?.id]);

    const editReviewHandler = useCallback(() => {
        if (userReview) {
            setRating(userReview.rating);
            setComment(userReview.comment);
            setIsEditing(true);
            const reviewSection = document.getElementById('review-form-section');
            if (reviewSection) {
                window.scrollTo({ top: reviewSection.offsetTop - 120, behavior: 'smooth' });
            }
        }
    }, [userReview]);

    const submitReviewHandler = async (e) => {
        e.preventDefault();
        if (!rating || !comment.trim()) {
            toast.error('Please provide both rating and comment');
            return;
        }
        setReviewLoading(true);

        try {
            if (isEditing) {
                await api.put(`/api/products/${id}/reviews/update/`, { rating, comment: comment.trim() });
                toast.success('Review updated successfully!', { icon: '✨' });
            } else {
                await api.post(`/api/products/${id}/reviews/create/`, { rating, comment: comment.trim() });
                toast.success('Review submitted successfully!', { icon: '⭐' });
            }
            setRating(0);
            setComment('');
            setIsEditing(false);
            fetchProduct();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Failed to submit review";
            toast.error(errorMsg);
        } finally {
            setReviewLoading(false);
        }
    };

    const deleteReviewHandler = async () => {
        if (!window.confirm('Are you sure you want to delete your review?')) return;
        try {
            await api.delete(`/api/products/${id}/reviews/delete/`);
            toast.success('Review deleted', { icon: '🗑️' });
            setIsEditing(false);
            fetchProduct();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Failed to delete review";
            toast.error(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-[2.5rem]"></div>
                    <div className="space-y-6 py-10">
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3 mt-8"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full mt-8"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen pt-32 px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white dark:bg-gray-800 p-10 rounded-[2rem] text-center shadow-2xl border border-gray-100 dark:border-gray-700">
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaShoppingCart className="text-4xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Product Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">{error || 'The product you are looking for does not exist or has been removed.'}</p>
                    <button onClick={() => navigate('/')} className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-primary/30">
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-24 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
            <Meta title={`${product.name} | SmartShop`} description={product.description} />

            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-3 text-sm mb-10 text-gray-500 dark:text-gray-400 font-medium">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-gray-900 dark:text-white font-bold truncate max-w-[200px] md:max-w-md">
                        {product.name}
                    </span>
                </nav>

                {/* Main Product Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20">
                    {/* Left: Images */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                        <div className="aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white dark:bg-gray-800 p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none relative group">
                            <img
                                src={getImageUrl(displayImage)}
                                alt={product.name}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                            />
                            {/* Badges */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                                {hasDiscount && (
                                    <span className="bg-red-500/90 backdrop-blur-sm text-white text-xs font-black px-4 py-2 rounded-full shadow-lg border border-red-400/50">
                                        SAVE {Math.round(((product.price - finalPrice) / product.price) * 100)}%
                                    </span>
                                )}
                            </div>
                            {/* Wishlist Button */}
                            <button
                                onClick={() => toggleWishlist(product)}
                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
                            >
                                {isInWishlist(product.id || product._id) ? (
                                    <FaHeart className="text-red-500 text-xl drop-shadow-md" />
                                ) : (
                                    <FaRegHeart className="text-gray-400 dark:text-gray-300 text-xl" />
                                )}
                            </button>
                        </div>

                        {/* Thumbnail Gallery */}
                        {product.gallery_images && product.gallery_images.length > 0 && (
                            <div className="grid grid-cols-4 gap-3 md:gap-4 mt-6">
                                <div onClick={() => setDisplayImage(product.image || product.main_image)}
                                    className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${displayImage === (product.image || product.main_image) ? 'border-primary ring-4 ring-primary/20 scale-95' : 'border-transparent bg-white dark:bg-gray-800 hover:border-primary/50'}`}>
                                    <img src={getImageUrl(product.image || product.main_image)} alt="Main" className="w-full h-full object-cover p-2" />
                                </div>
                                {product.gallery_images.map((img, index) => (
                                    <div key={index} onClick={() => setDisplayImage(img.image)}
                                        className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${displayImage === img.image ? 'border-primary ring-4 ring-primary/20 scale-95' : 'border-transparent bg-white dark:bg-gray-800 hover:border-primary/50'}`}>
                                        <img src={getImageUrl(img.image)} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover p-2" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Details */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-8 flex flex-col justify-center">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                                {product.name}
                            </h1>
                            
                            {/* تم تعديل وتجميل قسم التقييم وعدد التعليقات هنا */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <button 
                                    onClick={() => document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center gap-3 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all px-4 py-2 rounded-full cursor-pointer group shadow-sm"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Rating value={Number(product.rating) || 0} />
                                        <span className="text-gray-900 dark:text-white text-sm font-black pt-0.5">
                                            {Number(product.rating)?.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium group-hover:text-primary transition-colors pt-0.5">
                                        {product.num_reviews || product.reviews?.length || 0} {t('reviews') || 'Reviews'}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-baseline gap-4 mb-2">
                                <span className="text-4xl md:text-5xl font-black text-primary drop-shadow-sm">
                                    ${finalPrice}
                                </span>
                                {hasDiscount && (
                                    <span className="text-2xl text-gray-400 line-through font-semibold">
                                        ${product.price}
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-4">
                                {stockCount > 0 ? (
                                    <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl text-sm font-bold border border-green-200 dark:border-green-800">
                                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                                        In Stock ({stockCount} available)
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 dark:border-red-800">
                                        <FaCheckCircle className="hidden" /> Out of Stock
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700/50 shadow-inner">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg flex items-center gap-2">
                                <span>📄</span> Description
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                                {product.description || 'No description available for this product.'}
                            </p>
                        </div>

                        {stockCount > 0 && (
                            <div className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">Quantity</span>
                                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700">
                                        <button onClick={decreaseQty} disabled={qty === 1} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-none text-gray-600 dark:text-gray-400">
                                            <FaMinus />
                                        </button>
                                        <span className="w-14 text-center font-black text-xl text-gray-900 dark:text-white select-none">
                                            {qty}
                                        </span>
                                        <button onClick={increaseQty} disabled={qty >= stockCount} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-none text-gray-600 dark:text-gray-400">
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>

                                <button onClick={addToCartHandler} className="relative w-full overflow-hidden group bg-gradient-to-r from-primary to-orange-500 hover:to-orange-600 text-white font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 uppercase tracking-wide text-lg">
                                    <FaShoppingCart className="group-hover:animate-bounce" /> 
                                    <span>{t('addToCart') || 'Add to Cart'}</span>
                                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                                </button>
                            </div>
                        )}

                        {/* Features Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            {[
                                { icon: FaTruck, title: "Free Delivery", color: "blue" },
                                { icon: FaShieldAlt, title: "Secure Pay", color: "green" },
                                { icon: FaUndo, title: "Easy Returns", color: "orange" }
                            ].map((feat, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                    <feat.icon className={`text-2xl mb-3 text-${feat.color}-500`} />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{feat.title}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Section */}
                <div id="reviews" className="mt-20 scroll-mt-24">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="text-primary">⭐</span> {t('customerReviews') || 'Customer Reviews'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Reviews Form Area */}
                        <div className="lg:col-span-5" id="review-form-section">
                            <AnimatePresence mode="wait">
                                {userInfo ? (
                                    userReview && !isEditing ? (
                                        <motion.div 
                                            key="success-card"
                                            initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
                                            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                            exit={{ opacity: 0, rotateY: -90, scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10 p-8 rounded-[2rem] border border-green-200 dark:border-green-800 text-center shadow-lg"
                                        >
                                            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-green-500/30">
                                                <FaCheckCircle />
                                            </div>
                                            <h3 className="text-2xl font-black text-green-900 dark:text-green-400 mb-2">Thank You!</h3>
                                            <p className="text-green-700 dark:text-green-300 mb-8 font-medium">Your review has been published and helps others make better choices.</p>
                                            
                                            <div className="flex flex-col gap-3">
                                                <button onClick={editReviewHandler} className="w-full bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-green-100 dark:border-green-800">
                                                    <FaEdit /> Edit My Review
                                                </button>
                                                <button onClick={deleteReviewHandler} className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                                                    <FaTrash /> Delete Review
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.form 
                                            key="review-form"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onSubmit={submitReviewHandler} 
                                            className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none"
                                        >
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                                                {isEditing ? 'Update Your Review' : 'Write a Review'}
                                            </h3>

                                            <div className="mb-6">
                                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-3">Rating Score</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button type="button" key={star} onClick={() => setRating(star)}
                                                            className={`text-4xl transition-all transform hover:scale-125 hover:-translate-y-1 ${rating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-gray-200 dark:text-gray-700'}`}>
                                                            <FaStar />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mb-8">
                                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-3">Your Message</label>
                                                <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                                                    placeholder="What did you like or dislike?"
                                                />
                                            </div>

                                            <div className="flex gap-3">
                                                <button type="submit" disabled={reviewLoading} className="flex-1 bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                                    {reviewLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaShare />}
                                                    {isEditing ? 'Save Changes' : 'Post Review'}
                                                </button>
                                                {isEditing && (
                                                    <button type="button" onClick={() => { setIsEditing(false); setRating(0); setComment(''); }} className="px-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </motion.form>
                                    )
                                ) : (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 p-8 rounded-[2rem] text-center">
                                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-400 text-2xl">
                                            🔒
                                        </div>
                                        <p className="text-yellow-800 dark:text-yellow-500 font-bold mb-6 text-lg">Join our community to leave a review</p>
                                        <Link to={`/login?redirect=product/${id}`} className="inline-block w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-colors shadow-lg shadow-yellow-500/30">
                                            Login / Register
                                        </Link>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Reviews List Area */}
                        <div className="lg:col-span-7 relative">
                            {product.reviews && product.reviews.length > 0 ? (
                                <div className="relative">
                                    <motion.div 
                                        layout 
                                        className="space-y-4 overflow-hidden"
                                        initial={false}
                                        animate={{ height: "auto" }}
                                    >
                                        {product.reviews.slice(0, visibleReviewsCount).map((review, index) => {
                                            const reviewerName = review.user_name?.trim() || "عميل Smart Shop";
                                            const initialLetter = reviewerName.charAt(0).toUpperCase();

                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={index} 
                                                    className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                                                        String(review.user) === String(userInfo?.id) 
                                                        ? 'bg-gradient-to-br from-primary/5 to-transparent border-primary/30' 
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-200 font-black text-xl shadow-inner">
                                                                {initialLetter}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {reviewerName}
                                                                    {String(review.user) === String(userInfo?.id) && (
                                                                        <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black shadow-sm">
                                                                            أنت
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <Rating value={Number(review.rating) || 0} size="sm" />
                                                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                                        {new Date(review.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base pr-16">
                                                        {review.comment}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>

                                    {/* تأثير التلاشي وزر عرض المزيد */}
                                    {product.reviews.length > visibleReviewsCount && (
                                        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-gray-50 dark:from-gray-900 via-gray-50/80 dark:via-gray-900/80 to-transparent flex items-end justify-center pb-2 z-10 pointer-events-none">
                                            <button 
                                                onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                                                className="pointer-events-auto bg-white dark:bg-gray-800 text-primary dark:text-white font-bold py-3 px-8 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 transition-all flex items-center gap-2"
                                            >
                                                <span>قراءة المزيد من التعليقات</span>
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                                                    +{product.reviews.length - visibleReviewsCount}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* زر طي التعليقات إذا قام بفتحها كلها */}
                                    {visibleReviewsCount > 3 && visibleReviewsCount >= product.reviews.length && (
                                        <div className="flex justify-center mt-6">
                                            <button 
                                                onClick={() => {
                                                    setVisibleReviewsCount(3);
                                                    document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-gray-500 dark:text-gray-400 font-bold hover:text-primary transition-colors text-sm underline decoration-dashed underline-offset-4"
                                            >
                                                طي التعليقات
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                                        <FaStar className="text-4xl text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3">لا توجد تقييمات بعد</h4>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">كن أول من يشارك رأيه وتجربته حول هذا المنتج لمساعدة الآخرين!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-24 pt-12 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <FaFire className="text-orange-500" /> {t('relatedProducts') || 'You May Also Like'}
                            </h2>
                            <Link to={`/shop?category=${product.category}`} className="text-primary font-bold hover:underline hidden md:block">View Category</Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {relatedProducts.map((item, index) => (
                                <motion.div 
                                    key={item.id || item._id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => navigate(`/product/${item.id || item._id}`)}
                                    className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[1.5rem] p-4 border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className="aspect-square bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-5 overflow-hidden relative">
                                        <img src={getImageUrl(item.image)} alt={item.name} loading="lazy" onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors h-10 md:h-12">
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-gray-900 dark:text-white font-black text-lg md:text-xl">
                                            ${item.discount_price > 0 ? item.discount_price : item.price}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <FaPlus className="text-xs" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Footer */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 z-50 flex gap-3 pb-safe">
                {stockCount > 0 && (
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-1 py-1 border border-gray-200 dark:border-gray-700">
                        <button onClick={decreaseQty} disabled={qty === 1} className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 disabled:opacity-30">
                            <FaMinus size={12} />
                        </button>
                        <span className="font-black w-8 text-center text-gray-900 dark:text-white">{qty}</span>
                        <button onClick={increaseQty} disabled={qty >= stockCount} className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 disabled:opacity-30">
                            <FaPlus size={12} />
                        </button>
                    </div>
                )}
                <button onClick={addToCartHandler} disabled={stockCount === 0}
                    className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 shadow-lg shadow-primary/20">
                    <FaShoppingCart /> {stockCount > 0 ? 'Add to Cart' : 'Sold Out'}
                </button>
            </div>
        </div>
    );
};

export default ProductDetails;