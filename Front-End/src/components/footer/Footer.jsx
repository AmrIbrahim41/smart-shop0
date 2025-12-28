import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaWhatsapp, FaHeart } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';
import { links } from '../../api'; 

const Footer = () => {
  const { t } = useSettings();
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert("Thanks for subscribing! (This is a demo)");
  };

  return (
    <footer className="bg-white dark:bg-dark-accent border-t border-gray-200 dark:border-white/5 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* 1. logo & social */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-3xl font-black tracking-tighter text-primary mb-4 block">
              SMART<span className="text-gray-900 dark:text-white">SHOP</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              {t('footerDesc') || "Your one-stop shop for the best products. Quality guaranteed and fast shipping directly to your doorstep."}
            </p>
            <div className="flex gap-4">
              <SocialIcon 
                href={links.facebook} 
                icon={<FaFacebook />} 
                colorClass="hover:bg-blue-600" 
              />
              <SocialIcon 
                href={links.instagram} 
                icon={<FaInstagram />} 
                colorClass="hover:bg-pink-600" 
              />
              <SocialIcon 
                href={links.whatsapp} 
                icon={<FaWhatsapp />} 
                colorClass="hover:bg-green-600" 
              />
            </div>
          </div>

          {/*2. fast links */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
              {t('quickLinks') || "Quick Links"}
            </h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-primary transition">{t('home')}</Link></li>
              <li><Link to="/cart" className="hover:text-primary transition">{t('cart')}</Link></li>
              <li><Link to="/wishlist" className="hover:text-primary transition">{t('wishlist')}</Link></li>
              <li><Link to="/login" className="hover:text-primary transition">{t('login')}</Link></li>
            </ul>
          </div>

          {/* 3. customer srv */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
              {t('customerService') || "Customer Service"}
            </h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/profile" className="hover:text-primary transition">{t('myAccount') || "My Account"}</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition">{t('shippingPolicy') || "Shipping Policy"}</Link></li>
              <li><Link to="#" className="hover:text-primary transition">{t('returns') || "Returns"}</Link></li>
              <li><Link to="#" className="hover:text-primary transition">{t('faq') || "FAQ"}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
              {t('newsletter') || "Newsletter"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {t('newsletterDesc') || "Subscribe to get special offers and updates."}
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder={t('enterEmail') || "Enter your email"}
                className="bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary text-gray-900 dark:text-white text-sm rounded-lg px-4 py-3 outline-none transition"
              />
              <button type="submit" className="bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-sm transition uppercase">
                {t('subscribe') || "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* copy rights */}
        <div className="border-t border-gray-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            &copy; {currentYear} SmartShop. All Rights Reserved.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs flex items-center gap-1">
            Made with <FaHeart className="text-red-500 animate-pulse" /> by <span className="text-gray-900 dark:text-white font-bold">Amr Ibrahim</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ href, icon, colorClass }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" // for securty
    className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-white ${colorClass} hover:text-white transition duration-300`}
  >
    {icon}
  </a>
);

export default Footer;