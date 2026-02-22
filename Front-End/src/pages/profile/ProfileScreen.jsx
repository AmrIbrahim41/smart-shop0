import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../api';
import { FaUser, FaEnvelope, FaLock, FaCamera, FaSave, FaSpinner } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useSettings();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    birthdate: '',
    password: '',
    confirmPassword: ''
  });

  const [profile_picture, setprofile_picture] = useState(null);
  const [profile_picturePreview, setprofile_picturePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/users/profile/');

        setFormData({
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.profile?.phone || '',
          city: data.profile?.city || '',
          country: data.profile?.country || '',
          birthdate: data.profile?.birthdate || '',
          password: '',
          confirmPassword: ''
        });

        // تم التعديل هنا: استخدام profile_picture بدلاً من profile_picture
        if (data.profile?.profile_picture) {
          setprofile_picturePreview(getImageUrl(data.profile.profile_picture));
        }

      } catch (error) {
        console.error("Error fetching profile:", error);
        const errorMsg = error.response?.data?.detail || "Failed to load profile";
        toast.error(errorMsg);

        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setprofile_picture(file);
      setprofile_picturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setUpdating(true);

    try {
      const submitData = new FormData();
      submitData.append('first_name', formData.firstName);
      submitData.append('last_name', formData.lastName);
      submitData.append('phone', formData.phone || '');
      submitData.append('city', formData.city || '');
      submitData.append('country', formData.country || '');
      if (formData.birthdate) {
        submitData.append('birthdate', formData.birthdate);
      }

      if (formData.password) {
        submitData.append('password', formData.password);
      }

      if (profile_picture) {
        submitData.append('profile_picture', profile_picture);
      }

      const { data } = await api.put('/api/users/profile/update/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update localStorage with new user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUserInfo = {
        ...userInfo,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: data.email,
        profile: data.profile
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

      // تحديث صورة العرض في حالة تم إرجاع رابط جديد من السيرفر
      if (data.profile?.profile_picture) {
        setprofile_picturePreview(getImageUrl(data.profile.profile_picture));
      }

      toast.success('Profile updated successfully!', {
        icon: '✅',
        duration: 3000,
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

    } catch (error) {
      console.error("Update error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta title={`${t('profile') || 'Profile'} | SmartShop`} />

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
            {t('myProfile') || "My Profile"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Manage your personal information
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl p-6 md:p-10"
        >

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
                  {profile_picturePreview ? (
                    <img
                      src={profile_picturePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      <FaUser />
                    </div>
                  )}
                </div>

                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary hover:bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110">
                  <FaCamera />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Click the camera icon to change photo
              </p>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight border-b border-gray-200 dark:border-gray-700 pb-3">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-11 pr-4 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 ml-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="New York"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="USA"
                  />
                </div>

                {/* Birthdate */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight border-b border-gray-200 dark:border-gray-700 pb-3">
                Change Password (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Leave blank if you don't want to change your password
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={updating}
              whileHover={{ scale: updating ? 1 : 1.02 }}
              whileTap={{ scale: updating ? 1 : 0.98 }}
              className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating Profile...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </motion.button>

          </form>

        </motion.div>

      </div>
    </div>
  );
};

export default ProfileScreen;