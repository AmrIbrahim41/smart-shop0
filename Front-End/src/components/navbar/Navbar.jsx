import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaHeart, FaShoppingBag, FaSun, FaMoon, FaBars, FaTimes,
    FaArrowRight, FaUserCog, FaClipboardList, FaBox, FaUsers,
    FaSignOutAlt, FaUser, FaGlobe, FaChevronDown, FaChartLine, FaStore
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import SearchBox from '../searchbox/SearchBox';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { getImageUrl } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';

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
        const token = localStorage.getItem('token');
        try {
            const user = JSON.parse(localStorage.getItem('userInfo'));
            if (token && user) {
                setIsAuth(true);
                setUserInfo(user);
            } else {
                setIsAuth(false);
                setUserInfo(null);
            }
        } catch (e) {
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

    const logoutHandler = () => {
        clearCart();
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setIsAuth(false);
        navigate('/login');
    };

    const toggleProfileDropdown = () => setProfileDropdownOpen(!profileDropdownOpen);

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled
                        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-100 dark:border-white/5 py-3 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-transparent py-4'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">

                    {/* Logo & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-2xl text-gray-800 dark:text-white focus:outline-none"
                            onClick={() => setMenuOpen(true)}
                        >
                            <FaBars />
                        </button>

                        <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-1 group">
                            <span className="text-gray-900 dark:text-white group-hover:text-primary transition-colors">SMART</span>
                            <span className="text-primary group-hover:text-gray-900 dark:group-hover:text-white transition-colors">SHOP</span>
                        </Link>

                        {/* Desktop Shop Link */}
                        <Link to="/shop" className="hidden lg:flex items-center gap-2 ml-6 font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                            <FaStore className="text-lg mb-0.5" />
                            <span>Shop</span>
                        </Link>
                    </div>

                    {/* Search (Desktop) */}
                    <div className="hidden lg:block flex-1 max-w-lg mx-10">
                        <SearchBox />
                    </div>

                    {/* Desktop Actions */}
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
                                <NavIcon to="/wishlist" icon={<FaHeart />} count={wishlistItems.length} />
                                <NavIcon to="/cart" icon={<FaShoppingBag />} count={cartItems.reduce((acc, item) => acc + item.qty, 0)} />
                            </div>
                        )}

                        {isAuth ? (
                            <div className="relative">
                                <button onClick={toggleProfileDropdown} className="flex items-center gap-3 hover:opacity-80 transition focus:outline-none">
                                    <div className="text-right hidden xl:block">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Welcome</p>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">{userInfo.name.split(' ')[0]}</p>
                                    </div>
                                    <img src={userInfo?.profile?.profilePicture ? getImageUrl(userInfo.profile.profilePicture) : "https://via.placeholder.com/150"}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 dark:border-white/10 shadow-sm" alt="avatar" />
                                    <FaChevronDown size={10} className="text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {profileDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-14 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden py-2 z-50"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-2">
                                                <p className="font-bold text-gray-900 dark:text-white">{userInfo.name}</p>
                                                <p className="text-xs text-gray-500">{userInfo.email}</p>
                                            </div>

                                            <DropdownLink to="/profile" icon={<FaUser />} label={t('profile')} />

                                            {/* Admin Links */}
                                            {userInfo?.isAdmin && (
                                                <>
                                                    <div className="my-2 border-t border-gray-100 dark:border-white/5"></div>
                                                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin</p>
                                                    <DropdownLink to="/admin/dashboard" icon={<FaChartLine className="text-orange-500" />} label="Dashboard" />
                                                    <DropdownLink to="/admin/orderlist" icon={<FaClipboardList className="text-blue-500" />} label="Orders" />
                                                    <DropdownLink to="/admin/productlist" icon={<FaBox className="text-green-500" />} label="Products" />
                                                    <DropdownLink to="/admin/users" icon={<FaUsers className="text-purple-500" />} label="Users" />
                                                </>
                                            )}
                                            {userInfo?.profile?.user_type === 'vendor' && !userInfo?.isAdmin && (
                                                <DropdownLink to="/dashboard" icon={<FaUserCog className="text-orange-500" />} label="Vendor Dashboard" />
                                            )}

                                            <div className="my-2 border-t border-gray-100 dark:border-white/5"></div>
                                            <button onClick={logoutHandler} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 font-bold transition">
                                                <FaSignOutAlt /> {t('logout')}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                {t('login')}
                            </Link>
                        )}
                    </div>

                    <div className="lg:hidden flex items-center gap-3">
                        <Link to="/cart" className="relative p-2 text-gray-800 dark:text-white">
                            <FaShoppingBag size={20} />
                            {cartItems.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">{cartItems.length}</span>}
                        </Link>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        <motion.aside
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 w-[85%] max-w-[340px] h-full bg-gray-50 dark:bg-gray-900 z-[70] shadow-2xl overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">MENU</h2>
                                    <button onClick={() => setMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-red-500 transition">
                                        <FaTimes />
                                    </button>
                                </div>

                                {isAuth ? (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <img src={userInfo?.profile?.profilePicture ? getImageUrl(userInfo.profile.profilePicture) : "https://via.placeholder.com/150"}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md" alt="avatar" />
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('welcome')}</p>
                                            <p className="text-gray-900 dark:text-white font-black text-lg line-clamp-1">{userInfo.name}</p>
                                            <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-primary text-xs font-bold hover:underline mt-1 block">View Profile</Link>
                                        </div>
                                    </div>
                                ) : (
                                    <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30">
                                        {t('login')} / {t('register')}
                                    </Link>
                                )}
                            </div>

                            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                                <div><SearchBox /></div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Shop</p>
                                    <MobileLink to="/" icon={<FaBox />} label={t('home')} onClick={() => setMenuOpen(false)} />

                                    <MobileLink to="/shop" icon={<FaStore />} label="Shop Categories" onClick={() => setMenuOpen(false)} />

                                    {isAuth && (
                                        <>
                                            <MobileLink to="/cart" icon={<FaShoppingBag />} label={t('cart')} count={cartItems.length} onClick={() => setMenuOpen(false)} />
                                            <MobileLink to="/wishlist" icon={<FaHeart />} label={t('wishlist')} count={wishlistItems.length} onClick={() => setMenuOpen(false)} />
                                        </>
                                    )}
                                </div>
                                {isAuth && (userInfo?.isAdmin || userInfo?.profile?.user_type === 'vendor') && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Management</p>
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-white/5">
                                            {userInfo?.isAdmin && (
                                                <>
                                                    <MobileLink to="/admin/dashboard" icon={<FaChartLine className="text-orange-500" />} label="Dashboard" onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/orderlist" icon={<FaClipboardList className="text-blue-500" />} label="All Orders" onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/productlist" icon={<FaBox className="text-green-500" />} label="Products List" onClick={() => setMenuOpen(false)} simple />
                                                    <MobileLink to="/admin/users" icon={<FaUsers className="text-purple-500" />} label="Users Manager" onClick={() => setMenuOpen(false)} simple />
                                                </>
                                            )}
                                            {userInfo?.profile?.user_type === 'vendor' && !userInfo?.isAdmin && (
                                                <MobileLink to="/dashboard" icon={<FaUserCog className="text-orange-500" />} label="Seller Dashboard" onClick={() => setMenuOpen(false)} simple />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={toggleLanguage} className="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300">
                                        <FaGlobe /> {language === 'en' ? 'Arabic' : 'English'}
                                    </button>
                                    <button onClick={toggleTheme} className="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300">
                                        {theme === 'dark' ? <><FaSun className="text-yellow-500" /> Light</> : <><FaMoon /> Dark</>}
                                    </button>
                                </div>
                                {isAuth && (
                                    <button onClick={logoutHandler} className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition">
                                        <FaSignOutAlt /> {t('logout')}
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

const NavIcon = ({ to, icon, count }) => (
    <Link to={to} className="relative p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-all">
        <span className="text-lg">{icon}</span>
        {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full border border-white dark:border-gray-900 font-bold">{count}</span>}
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
        {count > 0 && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-md font-bold">{count}</span>}
        {!simple && !count && <FaArrowRight className="text-gray-300 text-xs" />}
    </Link>
);

export default Navbar;