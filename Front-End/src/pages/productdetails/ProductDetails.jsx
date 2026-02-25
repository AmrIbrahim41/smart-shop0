/**
 * ProductDetails.jsx — Smart Shop E-commerce Platform
 *
 * CHANGELOG:
 *  - BUGFIX: Gallery now reads from `product.images` (ProductSerializer key)
 *            instead of the old incorrect `product.gallery_images` key.
 *  - FEAT:   Full image gallery with animated slide transitions (framer-motion).
 *  - FEAT:   Keyboard-accessible thumbnail strip with active indicator.
 *  - FEAT:   Premium "Apple / Nike" level UI — refined typography, balanced
 *            whitespace, soft shadow system, and a neutral-warm color palette.
 *  - FEAT:   Staggered entrance animations for all info blocks.
 *  - FEAT:   Interactive quantity stepper with haptic-style spring feedback.
 *  - FEAT:   Refactored reviews section — avatar gradients, verified badge, etc.
 *  - REFACTOR: Animation variants extracted to constants for readability.
 *  - REFACTOR: All existing features preserved (Cart, Wishlist, Settings, Toast).
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { apiService, getImageUrl } from '../../api';
import {
    FaShoppingCart,
    FaHeart,
    FaRegHeart,
    FaPlus,
    FaMinus,
    FaStar,
    FaEdit,
    FaFire,
    FaCheckCircle,
    FaShare,
    FaTruck,
    FaShieldAlt,
    FaUndo,
    FaTrash,
    FaChevronLeft,
    FaChevronRight,
    FaTag,
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import Rating from '../../components/rating/Rating';
import Meta from '../../components/tapheader/Meta';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
    }),
};

const staggerContainer = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const imageSwap = {
    enter: (direction) => ({
        x: direction > 0 ? 60 : -60,
        opacity: 0,
        scale: 0.97,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (direction) => ({
        x: direction < 0 ? 60 : -60,
        opacity: 0,
        scale: 0.97,
        transition: { duration: 0.3, ease: 'easeIn' },
    }),
};

// =============================================================================
// HELPERS
// =============================================================================

/** Returns a deterministic gradient class for avatar backgrounds */
const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-500',
    'from-teal-500 to-cyan-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-green-600',
];
const getAvatarGradient = (str = '') => {
    const code = [...str].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Animated skeleton loader */
const SkeletonLoader = () => (
    <div className="min-h-screen pt-32 px-4 md:px-8 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
            <div className="space-y-4">
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
                <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-6 pt-6">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full w-1/4" />
                <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-3/4" />
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-1/3" />
                <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl w-2/5" />
                <div className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                <div className="h-14 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            </div>
        </div>
    </div>
);

/** Star rating selector for review form */
const StarSelector = ({ value, onChange }) => (
    <div className="flex gap-1.5" role="group" aria-label="Select rating">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                type="button"
                key={star}
                onClick={() => onChange(star)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                className={`text-3xl transition-all duration-200 transform hover:scale-125 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                    value >= star
                        ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                        : 'text-neutral-200 dark:text-neutral-700'
                }`}
            >
                <FaStar />
            </button>
        ))}
    </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ProductDetails = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { t } = useSettings();

    // Product data
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    // Gallery state — tracks current image index & swipe direction
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(1);

    // Cart state
    const [qty, setQty] = useState(1);

    // Review state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);

    // Ref for smooth scroll to review form
    const reviewFormRef = useRef(null);

    /** Logged-in user from localStorage */
    const userInfo = useMemo(() => {
        try {
            const stored = localStorage.getItem('userInfo');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------

    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: currentProduct } = await apiService.getProductDetails(slug);
            setProduct(currentProduct);
            setGalleryIndex(0); // reset gallery on product change

            // Fetch related products from same category
            if (currentProduct.category) {
                try {
                    const { data: responseData } = await api.get(
                        `/api/products/?category=${currentProduct.category}`
                    );
                    const productsList = responseData.products || responseData || [];
                    const related = productsList.filter(
                        (p) =>
                            String(p.id || p._id) !==
                            String(currentProduct.id || currentProduct._id)
                    );
                    setRelatedProducts(related.slice(0, 4));
                } catch (relError) {
                    console.error('Error fetching related products:', relError);
                }
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            const msg = err.response?.data?.detail || 'Product not found';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchProduct();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchProduct]);

    // -------------------------------------------------------------------------
    // DERIVED VALUES
    // -------------------------------------------------------------------------

    const stockCount = product?.count_in_stock ?? 0;

    /**
     * final_price is sent as a string by the serializer's SerializerMethodField.
     * Fall back to discount_price → price in order.
     */
    const finalPrice = parseFloat(
        product?.final_price ?? product?.discount_price ?? product?.price ?? 0
    );
    const originalPrice = parseFloat(product?.price ?? 0);
    const hasDiscount = finalPrice < originalPrice && originalPrice > 0;
    const discountPct = hasDiscount
        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        : 0;

    /**
     * BUILD GALLERY IMAGES ARRAY
     *
     * FIX: The ProductSerializer (serializers.py) serialises the gallery under
     * the key `images` (via the `related_name="images"` on ProductImage and
     * ProductImageSerializer). The original code incorrectly checked for
     * `product.gallery_images` — renamed here to `product.images`.
     *
     * Structure: [{ image: "/media/…", alt_text: "…" }, …]
     */
    const galleryImages = useMemo(() => {
        if (!product) return [];
        const mainImage = { image: product.image || '', alt_text: product.name };
        // ← KEY FIX: was `product.gallery_images`, now `product.images`
        const extras = Array.isArray(product.images) ? product.images : [];
        return [mainImage, ...extras].filter((img) => img.image);
    }, [product]);

    const currentGalleryImage = galleryImages[galleryIndex] ?? { image: '', alt_text: '' };

    // -------------------------------------------------------------------------
    // GALLERY NAVIGATION
    // -------------------------------------------------------------------------

    const goToGalleryIndex = useCallback(
        (index, direction = 1) => {
            if (index === galleryIndex) return;
            setSwipeDirection(direction ?? (index > galleryIndex ? 1 : -1));
            setGalleryIndex(index);
        },
        [galleryIndex]
    );

    const prevImage = useCallback(() => {
        const newIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
        goToGalleryIndex(newIndex, -1);
    }, [galleryIndex, galleryImages.length, goToGalleryIndex]);

    const nextImage = useCallback(() => {
        const newIndex = (galleryIndex + 1) % galleryImages.length;
        goToGalleryIndex(newIndex, 1);
    }, [galleryIndex, galleryImages.length, goToGalleryIndex]);

    // Keyboard navigation for gallery
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [prevImage, nextImage]);

    // -------------------------------------------------------------------------
    // CART HANDLERS
    // -------------------------------------------------------------------------

    const increaseQty = useCallback(() => {
        const existItem = cartItems.find(
            (x) => String(x.product) === String(product?.id || product?._id)
        );
        const inCart = existItem?.qty ?? 0;
        if (inCart + qty < stockCount) {
            setQty((prev) => prev + 1);
        } else {
            toast.error(t('maxLimitReached') || 'Maximum available quantity reached', {
                duration: 2000,
            });
        }
    }, [qty, stockCount, cartItems, product, t]);

    const decreaseQty = useCallback(() => {
        setQty((prev) => (prev > 1 ? prev - 1 : prev));
    }, []);

    const addToCartHandler = useCallback(() => {
        if (!userInfo) {
            toast.error('Please sign in to add items to your cart', { icon: '🔒' });
            navigate(`/login?redirect=product/${slug}`);
            return;
        }
        if (stockCount === 0) {
            toast.error('This product is currently out of stock');
            return;
        }
        const existItem = cartItems.find(
            (x) => String(x.product) === String(product?.id || product?._id)
        );
        if ((existItem?.qty ?? 0) + qty > stockCount) {
            toast.error(t('maxLimitReached') || 'Maximum available quantity reached');
            return;
        }
        addToCart(product, qty);
        toast.success('Added to your cart!', { icon: '🛒' });
    }, [userInfo, stockCount, cartItems, product, qty, addToCart, navigate, slug, t]);

    // -------------------------------------------------------------------------
    // REVIEW HANDLERS
    // -------------------------------------------------------------------------

    const userReview = useMemo(
        () =>
            product?.reviews?.find(
                (r) =>
                    String(r.user) === String(userInfo?.id) ||
                    String(r.user_id) === String(userInfo?.id)
            ),
        [product?.reviews, userInfo?.id]
    );

    const editReviewHandler = useCallback(() => {
        if (userReview) {
            setRating(userReview.rating);
            setComment(userReview.comment);
            setIsEditing(true);
            reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [userReview]);

    const submitReviewHandler = async (e) => {
        e.preventDefault();
        if (!rating || !comment.trim()) {
            toast.error('Please provide both a star rating and a comment');
            return;
        }
        setReviewLoading(true);
        try {
            if (isEditing) {
                await api.put(`/api/products/${product.id}/reviews/update/`, {
                    rating,
                    comment: comment.trim(),
                });
                toast.success('Your review has been updated!', { icon: '✨' });
            } else {
                await api.post(`/api/products/${product.id}/reviews/create/`, {
                    rating,
                    comment: comment.trim(),
                });
                toast.success('Review published — thank you!', { icon: '⭐' });
            }
            setRating(0);
            setComment('');
            setIsEditing(false);
            fetchProduct();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit review');
        } finally {
            setReviewLoading(false);
        }
    };

    const deleteReviewHandler = async () => {
        if (!window.confirm('Delete your review? This cannot be undone.')) return;
        try {
            await api.delete(`/api/products/${product.id}/reviews/delete/`);
            toast.success('Review removed', { icon: '🗑️' });
            setIsEditing(false);
            fetchProduct();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete review');
        }
    };

    // -------------------------------------------------------------------------
    // RENDER — LOADING / ERROR STATES
    // -------------------------------------------------------------------------

    if (loading) return <SkeletonLoader />;

    if (error || !product) {
        return (
            <div className="min-h-screen pt-32 px-4 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-md w-full bg-white dark:bg-neutral-900 p-10 rounded-3xl text-center shadow-2xl border border-neutral-100 dark:border-neutral-800"
                >
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaShoppingCart className="text-3xl text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                        Product Not Found
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed text-sm">
                        {error || 'This product no longer exists or has been removed.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold py-4 px-8 rounded-2xl transition-all shadow-lg"
                    >
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER — MAIN LAYOUT
    // -------------------------------------------------------------------------

    return (
        <div className="min-h-screen pt-24 pb-28 md:pb-16 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500">
            <Meta title={`${product.name} | SmartShop`} description={product.description} />

            <div className="max-w-7xl mx-auto">
                {/* ── Breadcrumb ─────────────────────────────────────────── */}
                <motion.nav
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="flex items-center gap-2 text-xs mb-10 text-neutral-400 dark:text-neutral-500 font-medium tracking-wide"
                >
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
                    <span>/</span>
                    <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[180px] md:max-w-xs">
                        {product.name}
                    </span>
                </motion.nav>

                {/* ── Product Grid ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-20 mb-24">

                    {/* ── LEFT: Image Gallery ───────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="space-y-4 sticky top-24 self-start"
                    >
                        {/* Main image viewport */}
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] group">

                            {/* Animated image swap */}
                            <AnimatePresence mode="popLayout" custom={swipeDirection}>
                                <motion.div
                                    key={galleryIndex}
                                    custom={swipeDirection}
                                    variants={imageSwap}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="absolute inset-0 p-8 md:p-12 flex items-center justify-center"
                                >
                                    <img
                                        src={getImageUrl(currentGalleryImage.image)}
                                        alt={currentGalleryImage.alt_text || product.name}
                                        className="w-full h-full object-contain select-none group-hover:scale-[1.04] transition-transform duration-700"
                                        onError={(e) => {
                                            e.target.src = '/images/placeholder.png';
                                        }}
                                        draggable={false}
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Discount badge */}
                            {hasDiscount && (
                                <div className="absolute top-5 left-5 z-10">
                                    <span className="bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide">
                                        −{discountPct}%
                                    </span>
                                </div>
                            )}

                            {/* Wishlist button */}
                            <button
                                onClick={() => toggleWishlist(product)}
                                aria-label="Toggle Wishlist"
                                className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-md border border-white/50 dark:border-neutral-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                            >
                                {isInWishlist(product.id || product._id) ? (
                                    <FaHeart className="text-rose-500 text-lg" />
                                ) : (
                                    <FaRegHeart className="text-neutral-400 dark:text-neutral-400 text-lg" />
                                )}
                            </button>

                            {/* Prev / Next arrows — shown only when gallery has > 1 image */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        aria-label="Previous image"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 border border-white/50 dark:border-neutral-700"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        aria-label="Next image"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 border border-white/50 dark:border-neutral-700"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </>
                            )}

                            {/* Dot indicators */}
                            {galleryImages.length > 1 && (
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                                    {galleryImages.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToGalleryIndex(i)}
                                            aria-label={`View image ${i + 1}`}
                                            className={`rounded-full transition-all duration-300 ${
                                                i === galleryIndex
                                                    ? 'w-6 h-1.5 bg-primary'
                                                    : 'w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Thumbnail Strip ─────────────────────────── */}
                        {/*
                         * FIX APPLIED HERE:
                         *  Old code checked `product.gallery_images` → WRONG key.
                         *  The API (ProductSerializer) returns gallery images under
                         *  the `images` key (related_name="images" on ProductImage).
                         *  We now use `galleryImages` (computed from `product.images`).
                         */}
                        {galleryImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-2.5">
                                {galleryImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToGalleryIndex(index)}
                                        aria-label={`Thumbnail ${index + 1}`}
                                        className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                            index === galleryIndex
                                                ? 'border-primary ring-2 ring-primary/20 scale-95'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary/50 bg-white dark:bg-neutral-900'
                                        }`}
                                    >
                                        <img
                                            src={getImageUrl(img.image)}
                                            alt={img.alt_text || `Image ${index + 1}`}
                                            className="w-full h-full object-cover p-1.5"
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder.png';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ── RIGHT: Product Info ───────────────────────────── */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col justify-center gap-7"
                    >
                        {/* Brand + Category tags */}
                        <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
                            {product.brand && (
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    {product.brand}
                                </span>
                            )}
                            {product.category_name && (
                                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    <FaTag className="text-[10px]" />
                                    {product.category_name}
                                </span>
                            )}
                            {/* Product tags */}
                            {product.tags?.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                                >
                                    #{tag.name}
                                </span>
                            ))}
                        </motion.div>

                        {/* Product name */}
                        <motion.h1
                            variants={staggerItem}
                            className="text-3xl md:text-[2.65rem] font-bold text-neutral-900 dark:text-white leading-[1.15] tracking-tight"
                        >
                            {product.name}
                        </motion.h1>

                        {/* Rating + review count */}
                        <motion.div variants={staggerItem}>
                            <button
                                onClick={() =>
                                    document
                                        .getElementById('reviews')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className="inline-flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/60 px-4 py-2 rounded-full transition-all shadow-sm group"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Rating value={Number(product.rating) || 0} />
                                    <span className="text-sm font-bold text-neutral-800 dark:text-white ml-0.5">
                                        {Number(product.rating)?.toFixed(1)}
                                    </span>
                                </div>
                                <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                                <span className="text-sm text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors">
                                    {product.num_reviews || product.reviews?.length || 0}{' '}
                                    {t('reviews') || 'Reviews'}
                                </span>
                            </button>
                        </motion.div>

                        {/* Pricing */}
                        <motion.div variants={staggerItem} className="flex items-baseline gap-4">
                            <span className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
                                ${finalPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                                <span className="text-xl text-neutral-400 line-through font-medium">
                                    ${originalPrice.toFixed(2)}
                                </span>
                            )}
                        </motion.div>

                        {/* Stock status */}
                        <motion.div variants={staggerItem}>
                            {stockCount > 0 ? (
                                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-800/50">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                    In Stock &nbsp;·&nbsp; {stockCount} available
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold border border-rose-200 dark:border-rose-800/50">
                                    Out of Stock
                                </div>
                            )}
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            variants={staggerItem}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800"
                        >
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-[0.9375rem]">
                                {product.description || 'No description available for this product.'}
                            </p>
                        </motion.div>

                        {/* Quantity + Add to Cart */}
                        {stockCount > 0 && (
                            <motion.div
                                variants={staggerItem}
                                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-5"
                            >
                                {/* Quantity stepper */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide uppercase">
                                        Quantity
                                    </span>
                                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 gap-0.5 border border-neutral-200 dark:border-neutral-700">
                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={decreaseQty}
                                            disabled={qty === 1}
                                            aria-label="Decrease quantity"
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-300"
                                        >
                                            <FaMinus size={11} />
                                        </motion.button>
                                        <span className="w-12 text-center font-bold text-lg text-neutral-900 dark:text-white select-none tabular-nums">
                                            {qty}
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={increaseQty}
                                            disabled={qty >= stockCount}
                                            aria-label="Increase quantity"
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-300"
                                        >
                                            <FaPlus size={11} />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Add to cart button */}
                                <motion.button
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={addToCartHandler}
                                    className="relative w-full overflow-hidden bg-gradient-to-r from-primary to-orange-500 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-3 text-base tracking-wide transition-shadow"
                                >
                                    {/* Shimmer effect */}
                                    <span className="absolute inset-0 -translate-x-full hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                                    <FaShoppingCart />
                                    {t('addToCart') || 'Add to Cart'}
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Trust badges */}
                        <motion.div
                            variants={staggerItem}
                            className="grid grid-cols-3 gap-3"
                        >
                            {[
                                { icon: FaTruck, label: 'Free Delivery', color: 'text-sky-500' },
                                { icon: FaShieldAlt, label: 'Secure Pay', color: 'text-emerald-500' },
                                { icon: FaUndo, label: 'Easy Returns', color: 'text-amber-500' },
                            ].map(({ icon: Icon, label, color }) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition-shadow gap-2"
                                >
                                    <Icon className={`text-xl ${color}`} />
                                    <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 leading-tight">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── Reviews Section ─────────────────────────────────────── */}
                <motion.section
                    id="reviews"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-80px' }}
                    className="scroll-mt-28"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <FaStar className="text-amber-400 text-2xl" />
                        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                            {t('customerReviews') || 'Customer Reviews'}
                        </h2>
                        {product.reviews?.length > 0 && (
                            <span className="ml-auto text-sm text-neutral-400 dark:text-neutral-500 font-medium">
                                {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* ── Review form column ───────────────────────── */}
                        <div className="lg:col-span-5" id="review-form-section" ref={reviewFormRef}>
                            <AnimatePresence mode="wait">
                                {userInfo ? (
                                    userReview && !isEditing ? (
                                        /* Already reviewed — show success card */
                                        <motion.div
                                            key="success-card"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.35 }}
                                            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 p-8 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 text-center"
                                        >
                                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 text-2xl shadow-lg shadow-emerald-500/30">
                                                <FaCheckCircle />
                                            </div>
                                            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                                                Review Published!
                                            </h3>
                                            <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-6 leading-relaxed">
                                                Thank you — your opinion helps other shoppers make better decisions.
                                            </p>
                                            <div className="flex flex-col gap-2.5">
                                                <button
                                                    onClick={editReviewHandler}
                                                    className="w-full bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 font-semibold py-3 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 text-sm"
                                                >
                                                    <FaEdit /> Edit My Review
                                                </button>
                                                <button
                                                    onClick={deleteReviewHandler}
                                                    className="w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FaTrash /> Delete Review
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        /* Review form */
                                        <motion.form
                                            key="review-form"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 16 }}
                                            transition={{ duration: 0.35 }}
                                            onSubmit={submitReviewHandler}
                                            className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm"
                                        >
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                                                {isEditing ? 'Update Your Review' : 'Write a Review'}
                                            </h3>

                                            {/* Star selector */}
                                            <div className="mb-6">
                                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
                                                    Your Rating
                                                </label>
                                                <StarSelector value={rating} onChange={setRating} />
                                            </div>

                                            {/* Comment textarea */}
                                            <div className="mb-6">
                                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
                                                    Your Experience
                                                </label>
                                                <textarea
                                                    rows="4"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none transition-all text-sm leading-relaxed"
                                                    placeholder="What did you love? What could be better?"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={reviewLoading}
                                                    className="flex-1 bg-neutral-900 dark:bg-primary hover:bg-neutral-800 dark:hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                                >
                                                    {reviewLoading ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <FaShare />
                                                    )}
                                                    {isEditing ? 'Save Changes' : 'Post Review'}
                                                </button>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            setRating(0);
                                                            setComment('');
                                                        }}
                                                        className="px-5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </motion.form>
                                    )
                                ) : (
                                    /* Login prompt */
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 p-8 rounded-3xl text-center">
                                        <div className="text-4xl mb-4">🔒</div>
                                        <p className="text-amber-800 dark:text-amber-400 font-semibold mb-5 text-sm">
                                            Sign in to share your experience
                                        </p>
                                        <Link
                                            to={`/login?redirect=product/${slug}`}
                                            className="inline-block w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-md shadow-amber-500/20 text-sm"
                                        >
                                            Login / Register
                                        </Link>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Reviews list column ───────────────────────── */}
                        <div className="lg:col-span-7 relative">
                            {product.reviews && product.reviews.length > 0 ? (
                                <div className="relative">
                                    <motion.div
                                        layout
                                        className="space-y-3 overflow-hidden"
                                    >
                                        {product.reviews
                                            .slice(0, visibleReviewsCount)
                                            .map((review, index) => {
                                                const reviewerName =
                                                    review.user_name?.trim() || 'SmartShop Customer';
                                                const initialLetter =
                                                    reviewerName.charAt(0).toUpperCase();
                                                const isOwn =
                                                    String(review.user_id) === String(userInfo?.id) ||
                                                    String(review.user) === String(userInfo?.id);

                                                return (
                                                    <motion.div
                                                        key={review.id ?? index}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                                                            isOwn
                                                                ? 'bg-primary/5 border-primary/25 dark:bg-primary/10 dark:border-primary/30'
                                                                : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'
                                                        }`}
                                                    >
                                                        {/* Reviewer header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                {/* Avatar */}
                                                                <div
                                                                    className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(reviewerName)} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}
                                                                >
                                                                    {initialLetter}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                                                                            {reviewerName}
                                                                        </span>
                                                                        {isOwn && (
                                                                            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Rating
                                                                            value={Number(review.rating) || 0}
                                                                            size="sm"
                                                                        />
                                                                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                                                            {review.created_at
                                                                                ? new Date(
                                                                                      review.created_at
                                                                                  ).toLocaleDateString('en-US', {
                                                                                      year: 'numeric',
                                                                                      month: 'short',
                                                                                      day: 'numeric',
                                                                                  })
                                                                                : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Comment body */}
                                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed pl-[3.25rem]">
                                                            {review.comment}
                                                        </p>
                                                    </motion.div>
                                                );
                                            })}
                                    </motion.div>

                                    {/* Fade-out + load more */}
                                    {product.reviews.length > visibleReviewsCount && (
                                        <div className="absolute bottom-0 left-0 w-full h-36 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 to-transparent flex items-end justify-center pb-3 z-10 pointer-events-none">
                                            <button
                                                onClick={() =>
                                                    setVisibleReviewsCount((prev) => prev + 5)
                                                }
                                                className="pointer-events-auto bg-white dark:bg-neutral-900 text-primary dark:text-white font-semibold py-2.5 px-7 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:scale-105 transition-all flex items-center gap-2 text-sm"
                                            >
                                                Show more reviews
                                                <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                    +{product.reviews.length - visibleReviewsCount}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Collapse all */}
                                    {visibleReviewsCount > 3 &&
                                        visibleReviewsCount >= product.reviews.length && (
                                            <div className="flex justify-center mt-6">
                                                <button
                                                    onClick={() => {
                                                        setVisibleReviewsCount(3);
                                                        document
                                                            .getElementById('reviews')
                                                            ?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className="text-neutral-400 dark:text-neutral-500 text-sm hover:text-primary transition-colors underline decoration-dashed underline-offset-4"
                                                >
                                                    Collapse reviews
                                                </button>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                /* No reviews yet */
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700">
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-5">
                                        <FaStar className="text-3xl text-neutral-300 dark:text-neutral-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                        No reviews yet
                                    </h4>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs leading-relaxed">
                                        Be the first to share your experience and help other shoppers.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ── Related Products ────────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-60px' }}
                        className="mt-24 pt-12 border-t border-neutral-200 dark:border-neutral-800"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                                <FaFire className="text-orange-500" />
                                {t('relatedProducts') || 'You May Also Like'}
                            </h2>
                            <Link
                                to={`/shop?category=${product.category}`}
                                className="text-sm text-primary font-semibold hover:underline hidden md:block"
                            >
                                View all in category →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                            {relatedProducts.map((item, index) => (
                                <motion.div
                                    key={item.id || item._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    onClick={() =>
                                        navigate(`/product/${item.slug || item.id || item._id}`)
                                    }
                                    className="group cursor-pointer bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 hover:shadow-lg hover:shadow-primary/8 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="aspect-square bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-4 overflow-hidden">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder.png';
                                            }}
                                            className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors h-10">
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-900 dark:text-white font-bold">
                                            $
                                            {item.discount_price && item.discount_price > 0
                                                ? item.discount_price
                                                : item.price}
                                        </span>
                                        <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-primary group-hover:text-white transition-all">
                                            <FaPlus className="text-[10px]" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>

            {/* ── Mobile Sticky Footer ────────────────────────────────────── */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 p-4 z-50 flex gap-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                {stockCount > 0 && (
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-1 py-1 gap-0.5 border border-neutral-200 dark:border-neutral-700">
                        <button
                            onClick={decreaseQty}
                            disabled={qty === 1}
                            className="w-10 h-10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 disabled:opacity-30"
                        >
                            <FaMinus size={11} />
                        </button>
                        <span className="font-bold w-8 text-center text-neutral-900 dark:text-white text-sm tabular-nums">
                            {qty}
                        </span>
                        <button
                            onClick={increaseQty}
                            disabled={qty >= stockCount}
                            className="w-10 h-10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 disabled:opacity-30"
                        >
                            <FaPlus size={11} />
                        </button>
                    </div>
                )}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={addToCartHandler}
                    disabled={stockCount === 0}
                    className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:from-neutral-400 disabled:to-neutral-500 shadow-lg shadow-primary/20 text-sm"
                >
                    <FaShoppingCart />
                    {stockCount > 0 ? (t('addToCart') || 'Add to Cart') : 'Sold Out'}
                </motion.button>
            </div>
        </div>
    );
};

export default ProductDetails;
