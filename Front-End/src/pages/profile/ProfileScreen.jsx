import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ENDPOINTS, getImageUrl } from '../../api';
import { FaCamera, FaBoxOpen, FaUserEdit, FaCalendarAlt, FaMapMarkerAlt, FaGlobe, FaSave, FaUser, FaSpinner } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useSettings();

  // --- State Management ---
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', country: '', birthdate: '',
    password: '', confirmPassword: ''
  });

  const [images, setImages] = useState({
    file: null,
    preview: null
  });

  const [userType, setUserType] = useState('customer');
  const [status, setStatus] = useState({ loading: true, updating: false, message: null, error: false });
  const [orders, setOrders] = useState({ myOrders: [], sellerOrders: [] });

  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo'));
    } catch {
      return null;
    }
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const initializeProfile = () => {
      let fName = '', lName = '';
      if (userInfo.first_name || userInfo.last_name) {
        fName = userInfo.first_name || '';
        lName = userInfo.last_name || '';
      } else if (userInfo.name) {
        const parts = userInfo.name.split(' ');
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      setFormData(prev => ({
        ...prev,
        firstName: fName,
        lastName: lName,
        email: userInfo.email || '',
        phone: userInfo.profile?.phone || '',
        city: userInfo.profile?.city || '',
        country: userInfo.profile?.country || '',
        birthdate: userInfo.profile?.birthdate || '',
      }));

      setUserType(userInfo.profile?.user_type || 'customer');
      if (userInfo.profile?.profilePicture) {
        setImages(prev => ({ ...prev, preview: getImageUrl(userInfo.profile.profilePicture) }));
      }
    };

    const fetchOrders = async () => {
      try {
        const promises = [api.get(ENDPOINTS.MY_ORDERS)];

        if (userInfo.profile?.user_type === 'vendor') {
          promises.push(api.get('/api/users/seller/orders/'));
        }

        const results = await Promise.all(promises);

        setOrders(prev => ({
          ...prev,
          myOrders: results[0].data,
          sellerOrders: results[1] ? results[1].data : []
        }));

      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    initializeProfile();
    fetchOrders();
  }, [userInfo, navigate]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadFileHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImages({
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setStatus({ ...status, message: null, error: false });

    if (formData.password !== formData.confirmPassword) {
      setStatus({ ...status, message: t('passwordsDoNotMatch') || 'Passwords do not match', error: true });
      return;
    }

    setStatus(prev => ({ ...prev, updating: true }));

    const submitData = new FormData();
    submitData.append('first_name', formData.firstName);
    submitData.append('last_name', formData.lastName);
    submitData.append('phone', formData.phone);
    submitData.append('city', formData.city);
    submitData.append('country', formData.country);
    submitData.append('birthdate', formData.birthdate);

    if (formData.password) {
      submitData.append('password', formData.password);
    }

    if (images.file) {
      submitData.append('profile_picture', images.file);
    }

    try {
      const { data } = await api.put('/api/users/profile/update/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      setStatus({
        loading: false,
        updating: false,
        message: t('profileUpdated') || 'Profile Updated Successfully ✅',
        error: false
      });

      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

    } catch (error) {
      console.error(error);
      setStatus({
        loading: false,
        updating: false,
        message: error.response?.data?.detail || t('profileUpdateError') || 'Error updating profile ❌',
        error: true
      });
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta title={t('myProfile') || "My Profile"} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: User Card & Form  */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-xl sticky top-28">

            {/* Profile Image */}
            <div className="relative w-32 h-32 mx-auto mb-6 group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-700">
                <img
                  src={images.preview ? images.preview : "/images/placeholder.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/images/placeholder.png"; 
                  }}
                />
              </div>
              <label className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full cursor-pointer hover:bg-orange-600 transition shadow-lg hover:scale-110 z-10">
                <FaCamera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={uploadFileHandler} />
              </label>
            </div>

            <h2 className="text-xl font-black text-center text-gray-900 dark:text-white mb-1 truncate px-2">
              {formData.firstName} {formData.lastName}
            </h2>
            <div className="flex justify-center mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${userType === 'vendor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {t(userType) || userType}
              </span>
            </div>

            {status.message && (
              <div className={`p-3 rounded-xl mb-6 text-xs font-bold text-center animate-pulse ${status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('firstName')}</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" placeholder="First Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('lastName')}</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" placeholder="Last Name" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('email')}</label>
                <input type="email" value={formData.email} readOnly className="w-full bg-gray-100 dark:bg-gray-700/50 border border-transparent rounded-xl p-2.5 text-sm text-gray-500 cursor-not-allowed" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('phone')}</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" placeholder="Phone Number" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><FaCalendarAlt /> {t('birthdate')}</label>
                <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><FaMapMarkerAlt /> {t('city')}</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><FaGlobe /> {t('country')}</label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                <p className="text-xs font-bold text-primary uppercase text-center">{t('changePassword') || "Change Password"}</p>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" placeholder={t('newPasswordPlaceholder')} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white focus:border-primary outline-none transition" placeholder={t('confirmPasswordPlaceholder')} />
              </div>

              <button
                type="submit"
                disabled={status.updating}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:shadow-lg transition flex justify-center items-center gap-2 uppercase text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status.updating ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {status.updating ? 'Saving...' : (t('saveChanges') || "SAVE CHANGES")}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Orders */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-10">

          {/* User Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-8 border border-gray-100 dark:border-white/5 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase">
              <span className="p-3 bg-primary/10 text-primary rounded-2xl"><FaBoxOpen /></span>
              {t('myPurchases') || "My Orders"}
            </h2>
            {status.loading ? (
              <div className="text-center py-10 opacity-50 font-bold flex flex-col items-center gap-2">
                <FaSpinner className="animate-spin text-2xl text-primary" /> Loading...
              </div>
            ) : orders.myOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-medium">{t('noPurchases') || "No orders yet."}</div>
            ) : (
              <OrdersTable orders={orders.myOrders} isSeller={false} navigate={navigate} t={t} />
            )}
          </div>

          {/* Seller Dashboard Preview (If Vendor) */}
          {userType === 'vendor' && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-[2.5rem] p-6 md:p-8 border border-gray-700 shadow-xl text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3 uppercase">
                  <span className="p-3 bg-white/10 rounded-2xl"><FaUserEdit className="text-green-400" /></span>
                  {t('salesDashboard') || "Incoming Orders"}
                </h2>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition">
                  Manage Products &rarr;
                </button>
              </div>

              {orders.sellerOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">{t('noSalesRequests') || "No incoming sales yet."}</div>
              ) : (
                <OrdersTable orders={orders.sellerOrders} isSeller={true} navigate={navigate} t={t} isDarkBg={true} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersTable = ({ orders, isSeller, navigate, t, isDarkBg = false }) => {
  return (
    <div className="overflow-hidden">
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => {
          // Safety check for ID
          const orderId = isSeller ? (order.order_id) : (order._id || order.id);
          const safeId = orderId ? orderId.toString().substring(0, 8) : '???';

          return (
            <div key={orderId || Math.random()} className={`p-4 rounded-2xl border ${isDarkBg ? 'bg-white/5 border-white/10' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`font-black text-sm ${isDarkBg ? 'text-white' : 'text-gray-900 dark:text-white'}`}>#{safeId}</span>
                <span className={`text-xs font-bold ${isDarkBg ? 'text-gray-400' : 'text-gray-500'}`}>{order.createdAt?.substring(0, 10)}</span>
              </div>
              <div className="mb-3">
                {isSeller ? (
                  <p className={`font-bold ${isDarkBg ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>{order.name} <span className="text-xs opacity-70">({order.qty}x)</span></p>
                ) : (
                  <p className="text-primary font-black">${order.totalPrice}</p>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2 text-[10px] font-black uppercase">
                  <span className={`px-2 py-1 rounded ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{order.isPaid ? 'Paid' : 'Unpaid'}</span>
                  <span className={`px-2 py-1 rounded ${order.isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.isDelivered ? 'Delivered' : 'Pending'}</span>
                </div>
                <button onClick={() => navigate(`/order/${orderId}`)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${isDarkBg ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90'}`}>
                  {t('view')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${isDarkBg ? 'text-gray-400 border-b border-white/10' : 'text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10'}`}>
              <th className="p-4 pl-0">ID</th>
              <th className="p-4">{t('date')}</th>
              <th className="p-4">{isSeller ? t('product') : t('total')}</th>
              <th className="p-4 text-center">{t('paid')}</th>
              <th className="p-4 text-center">{t('delivered')}</th>
              <th className="p-4 text-right"></th>
            </tr>
          </thead>
          <tbody className={`text-sm font-medium ${isDarkBg ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
            {orders.map((order) => {
              const orderId = isSeller ? (order.order_id) : (order._id || order.id);
              const safeId = orderId ? orderId.toString().substring(0, 8) : '???';
              return (
                <tr key={orderId || Math.random()} className="group hover:bg-black/5 dark:hover:bg-white/5 transition border-b border-transparent hover:border-gray-200 dark:hover:border-white/10">
                  <td className={`p-4 pl-0 font-bold ${isDarkBg ? 'text-white' : 'text-gray-900 dark:text-white'}`}>#{safeId}..</td>
                  <td className="p-4">{order.createdAt?.substring(0, 10)}</td>
                  <td className="p-4">
                    {isSeller ? (
                      <div>
                        <span className={`block font-bold ${isDarkBg ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{order.name}</span>
                        <span className="text-xs opacity-60">{order.qty} x ${order.price}</span>
                      </div>
                    ) : (
                      <span className="text-primary font-bold">${order.totalPrice}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {order.isPaid ? <span className="text-green-500">✔</span> : <span className="text-red-500">✖</span>}
                  </td>
                  <td className="p-4 text-center">
                    {order.isDelivered ? <span className="text-green-500">✔</span> : <span className="text-yellow-500">●</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => navigate(`/order/${orderId}`)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${isDarkBg ? 'bg-white/10 hover:bg-white text-white hover:text-black' : 'bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-white'}`}>
                      {t('view')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileScreen;