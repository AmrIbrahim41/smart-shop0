import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Meta from '../../components/tapheader/Meta';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';
import { useSettings } from '../../context/SettingsContext';
import { FaMapMarkerAlt, FaCity, FaGlobe, FaMailBulk, FaArrowRight } from 'react-icons/fa';

const ShippingScreen = () => {
  const { shippingAddress, saveShippingAddress } = useCart();
  const navigate = useNavigate();
  const { t } = useSettings();

  // --- State Management ---
  const [formData, setFormData] = useState({
    address: shippingAddress.address || '',
    city: shippingAddress.city || '',
    postalCode: shippingAddress.postalCode || '',
    country: shippingAddress.country || ''
  });

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitHandler = useCallback((e) => {
    e.preventDefault();
    saveShippingAddress(formData);
    navigate('/payment');
  }, [formData, saveShippingAddress, navigate]);

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 flex flex-col items-center">
      <Meta title={t('shipping') || "Shipping"} />
      
      {/* Steps Indicator */}
      <div className="w-full max-w-4xl mb-8">
         <CheckoutSteps step1 step2 />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl transition-all">
            
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    {t('shippingAddress') || "Shipping Details"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Where should we deliver your order?
                </p>
            </div>

            <form onSubmit={submitHandler} className="space-y-5">
            
                {/* Reusable Input Fields for Cleaner Code */}
                <InputField 
                    label={t('address') || "Address"}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    icon={<FaMapMarkerAlt />}
                    placeholder="123 Main St"
                />

                <InputField 
                    label={t('city') || "City"}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    icon={<FaCity />}
                    placeholder="New York"
                />

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <InputField 
                            label={t('postalCode') || "Postal Code"}
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            icon={<FaMailBulk />}
                            placeholder="10001"
                        />
                    </div>
                    <div className="flex-1">
                        <InputField 
                            label={t('country') || "Country"}
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            icon={<FaGlobe />}
                            placeholder="USA"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-orange-600 hover:shadow-lg hover:shadow-orange-500/30 text-white font-black py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6 uppercase flex items-center justify-center gap-2"
                >
                    {t('continue') || "CONTINUE TO PAYMENT"} <FaArrowRight />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, icon, placeholder }) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
            {label}
        </label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                {icon}
            </div>
            <input
                type="text"
                name={name}
                required
                value={value}
                onChange={onChange}
                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm placeholder-gray-300 dark:placeholder-gray-600"
                placeholder={placeholder}
            />
        </div>
    </div>
);

export default ShippingScreen;