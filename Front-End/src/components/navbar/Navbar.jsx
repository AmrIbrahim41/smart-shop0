import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaHeart, FaShoppingBag, FaSun, FaMoon, FaBars, FaTimes,
    FaArrowRight, FaUserCog, FaClipboardList, FaBox, FaUsers,
    FaSignOutAlt, FaUser, FaGlobe, FaChevronDown, FaChartLine, FaStore, FaPlus
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import SearchBox from '../searchbox/SearchBox';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { getImageUrl } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { wishlistItems } = useWishlist();
    const { theme, toggleTheme, language, toggleLanguage, t } = useSettings();
    const { cartItems, clearCart } = useCart();

    const [isAuth, setIsAuth] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const checkAuth = useCallback(() => {
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('userInfo');

            if (token && user) {
                const parsedUser = JSON.parse(user);
                setIsAuth(true);
                setUserInfo(parsedUser);
            } else {
                setIsAuth(false);
                setUserInfo(null);
            }
        } catch (error) {
            console.error("Auth check error:", error);
            setIsAuth(false);
            setUserInfo(null);
        }
    }, []);

    useEffect(() => {
        checkAuth();
        setMenuOpen(false);
        setProfileDropdownOpen(false);
    }, [location, checkAuth]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logoutHandler = useCallback(() => {
        try {
            clearCart();
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('shippingAddress');
            localStorage.removeItem('paymentMethod');

            setIsAuth(false);
            setUserInfo(null);
            setMenuOpen(false);
            setProfileDropdownOpen(false);

            toast.success('Logged out successfully', {
                icon: '👋',
                duration: 2000,
            });

            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            toast.error('Error during logout');
        }
    }, [clearCart, navigate]);

    const toggleProfileDropdown = useCallback(() => {
        setProfileDropdownOpen(prev => !prev);
    }, []);

    const isAdmin = userInfo?.isAdmin === true || userInfo?.is_admin === true;
    const isVendor =
        userInfo?.profile?.userType === 'vendor' || 
        userInfo?.profile?.user_type === 'vendor' || 
        userInfo?.user_type === 'vendor' ||
        userInfo?.userType === 'vendor';

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
                    scrolled
                        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-100 dark:border-white/5 py-3 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-transparent py-4'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">

                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-2xl text-gray-800 dark:text-white focus:outline-none hover:text-primary transition"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <FaBars />
                        </button>

                        <Link
                            to="/"
                            className="text-2xl font-black tracking-tighter flex items-center gap-1 group"
                        >
                            <span className="text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                SMART
                            </span>
                            <span className="text-primary group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                SHOP
                            </span>
                        </Link>

                        <Link
                            to="/shop"
                            className="hidden lg:flex items-center gap-2 ml-6 font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            <FaStore className="text-lg mb-0.5" />
                            <span>{t('shop') || 'Shop'}</span>
                        </Link>
                    </div>

                    <div className="hidden lg:block flex-1 max-w-lg mx-10">
                        <SearchBox />
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                        <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 rounded-full p-1 border border-gray-200 dark:border-white/5">
                            <button
                                onClick={toggleLanguage}
                                className="px-3 py-1 text-[10px] font-black tracking-widest text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-full transition-all"
                            >
                                {language === 'en' ? 'AR' : 'EN'}
                            </button>
                            <div className="w-[1px] h-3 bg-gray-300 dark:bg-white/20 mx-1"></div>
                            <button
                                onClick={toggleTheme}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-full transition-all"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {theme === 'dark' ? <FaSun size={12} /> : <FaMoon size={12} />}
                                </motion.div>
                            </button>
                        </div>

                        {isAuth && (
                            <div className="flex items-center gap-4">
                                <NavIcon to="/wishlist" icon={<FaHeart />} count={wishlistItems.length} label="Wishlist" />
                                <NavIcon to="/cart" icon={<FaShoppingBag />} count={cartItems.length} label="Cart" />
                            </div>
                        )}

                        {isAuth ? (
                            <div className="relative">
                                <button
                                    onClick={toggleProfileDropdown}
                                    className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5"
                                >
                                    <img
                                        src={
                                            userInfo?.profile?.profile_picture || userInfo?.profile?.profilePicture
                                                ? getImageUrl(userInfo.profile.profile_picture || userInfo.profile.profilePicture)
                                                : "https://via.placeholder.com/150"
                                        }
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700"
                                        alt="avatar"
                                    />
                                    <span className="font-bold text-gray-900 dark:text-white text-sm max-w-[120px] truncate">
                                        {userInfo.name || userInfo.username}
                                    </span>
                                    <FaChevronDown className={`text-xs text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {profileDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 py-2 overflow-hidden z-50"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                                                    {t('account') || 'Account'}
                                                </p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">
                                                    {userInfo.email}
                                                </p>
                                            </div>

                                            <DropdownLink to="/profile" icon={<FaUser />} label={t('profile') || 'My Profile'} />

                                            {isAdmin && (
                                                <>
                                                    <div className="border-t border-gray-100 dark:border-white/5 my-2"></div>
                                                    <div className="px-4 py-2">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-black mb-1">
                                                            {t('admin') || 'Admin Panel'}
                                                        </p>
                                                    </div>
                                                    <DropdownLink to="/admin/dashboard" icon={<FaChartLine />} label="Dashboard" />
                                                    <DropdownLink to="/admin/orderlist" icon={<FaClipboardList />} label={t('orders') || 'Orders'} />
                                                    <DropdownLink to="/admin/productlist" icon={<FaBox />} label={t('products') || 'Products'} />
                                                    <DropdownLink to="/admin/users" icon={<FaUsers />} label={t('users') || 'Users'} />
                                                    <DropdownLink to="/admin/categories" icon={<FaStore />} label="Categories" />
                                                </>
                                            )}

                                            {isVendor && !isAdmin && (
                                                <>
                                                    <div className="border-t border-gray-100 dark:border-white/5 my-2"></div>
                                                    <div className="px-4 py-2">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-black mb-1">
                                                            {t('seller') || 'Seller Panel'}
                                                        </p>
                                                    </div>
                                                    <DropdownLink to="/seller/products/add" icon={<FaPlus />} label="Add New Product" />
                                                    <DropdownLink to="/dashboard" icon={<FaChartLine />} label="Seller Dashboard" />
                                                </>
                                            )}

                                            <div className="border-t border-gray-100 dark:border-white/5 mt-2 pt-2 px-2">
                                                <button
                                                    onClick={logoutHandler}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition"
                                                >
                                                    <FaSignOutAlt /> {t('logout') || 'Logout'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                            >
                                {t('login') || 'Login'}
                                <FaArrowRight className="text-xs" />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 w-[85%] max-w-[340px] h-full bg-gray-50 dark:bg-gray-900 z-[70] shadow-2xl overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">MENU</h2>
                                    <button
                                        onClick={() => setMenuOpen(false)}
                                        className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-red-500 transition"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {isAuth ? (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <img
                                            src={
                                                userInfo?.profile?.profile_picture || userInfo?.profile?.profilePicture
                                                    ? getImageUrl(userInfo.profile.profile_picture || userInfo.profile.profilePicture)
                                                    : "https://via.placeholder.com/150"
                                            }
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                                            alt="avatar"
                                        />
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                                {t('welcome') || 'Welcome'}
                                            </p>
                                            <p className="text-gray-900 dark:text-white font-black text-lg line-clamp-1">
                                                {userInfo.name || userInfo.username}
                                            </p>
                                            <Link
                                                to="/profile"
                                                onClick={() => setMenuOpen(false)}
                                                className="text-primary text-xs font-bold hover:underline mt-1 block"
                                            >
                                                {t('viewProfile') || 'View Profile'}
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center justify-center w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30"
                                    >
                                        {t('login') || 'Login'} / {t('register') || 'Register'}
                                    </Link>
                                )}
                            </div>

                            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                                <div>
                                    <SearchBox />
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                                        {t('shop') || 'Shop'}
                                    </p>
                                    <MobileLink to="/" icon={<FaBox />} label={t('home') || 'Home'} onClick={() => setMenuOpen(false)} />
                                    <MobileLink to="/shop" icon={<FaStore />} label={t('shopCategories') || 'Shop Categories'} onClick={() => setMenuOpen(false)} />

                                    {isAuth && (
                                        <>
                                            <MobileLink
                                                to="/cart"
                                                icon={<FaShoppingBag />}
                                                label={t('cart') || 'Cart'}
                                                count={cartItems.length}
                                                onClick={() => setMenuOpen(false)}
                                            />
                                            <MobileLink
                                                to="/wishlist"
                                                icon={<FaHeart />}
                                                label={t('wishlist') || 'Wishlist'}
                                                count={wishlistItems.length}
                                                onClick={() => setMenuOpen(false)}
                                            />
                                        </>
                                    )}
                                </div>

                                {isAuth && (isAdmin || isVendor) && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                                            {isAdmin ? (t('management') || 'Admin Panel') : (t('seller') || 'Seller Panel')}
                                        </p>
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-white/5">
                                            {isAdmin && (
                                                <>
                                                    <MobileLink to="/admin/dashboard" icon={<FaChartLine className="text-orange-500" />} label="Dashboard" onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/orderlist" icon={<FaClipboardList className="text-blue-500" />} label={t('allOrders') || 'All Orders'} onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/productlist" icon={<FaBox className="text-green-500" />} label={t('productsList') || 'Products List'} onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/users" icon={<FaUsers className="text-purple-500" />} label={t('usersManager') || 'Users Manager'} onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/categories" icon={<FaStore className="text-pink-500" />} label="Categories" onClick={() => setMenuOpen(false)} simple />
                                                </>
                                            )}
                                            {isVendor && !isAdmin && (
                                                <>
                                                    <MobileLink to="/seller/products/add" icon={<FaPlus className="text-green-500" />} label="Add New Product" onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/dashboard" icon={<FaChartLine className="text-blue-500" />} label="Seller Dashboard" onClick={() => setMenuOpen(false)} simple />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={toggleLanguage} className="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                        <FaGlobe /> {language === 'en' ? 'Arabic' : 'English'}
                                    </button>
                                    <button onClick={toggleTheme} className="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                        {theme === 'dark' ? <><FaSun className="text-yellow-500" /> Light</> : <><FaMoon /> Dark</>}
                                    </button>
                                </div>
                                {isAuth && (
                                    <button onClick={logoutHandler} className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition">
                                        <FaSignOutAlt /> {t('logout') || 'Logout'}
                                    </button>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

const NavIcon = ({ to, icon, count, label }) => (
    <Link to={to} className="relative p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-all" aria-label={label}>
        <span className="text-lg">{icon}</span>
        {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full border border-white dark:border-gray-900 font-bold">
                {count}
            </span>
        )}
    </Link>
);

const DropdownLink = ({ to, icon, label }) => (
    <Link to={to} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition">
        <span className="text-lg opacity-80">{icon}</span> {label}
    </Link>
);

const MobileLink = ({ to, icon, label, count, onClick, simple }) => (
    <Link to={to} onClick={onClick} className={`flex items-center justify-between p-3 rounded-xl transition-all ${simple ? 'hover:bg-gray-50 dark:hover:bg-white/5' : 'bg-transparent hover:bg-white dark:hover:bg-white/5 hover:shadow-sm'}`}>
        <div className="flex items-center gap-4">
            <span className={`text-xl ${simple ? '' : 'text-gray-400'}`}>{icon}</span>
            <span className={`font-bold ${simple ? 'text-sm text-gray-600 dark:text-gray-300' : 'text-base text-gray-800 dark:text-white'}`}>{label}</span>
        </div>
        {count > 0 && (
            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-md font-bold">{count}</span>
        )}
        {!simple && !count && <FaArrowRight className="text-gray-300 text-xs" />}
    </Link>
);

export default Navbar;