import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { ENDPOINTS } from '../../api'; 
import { FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext';

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();

  // --- State Management ---
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('userInfo')) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(ENDPOINTS.LOGIN, {
        "username": formData.email, 
        "password": formData.password
      });

      const data = response.data;
      
      localStorage.setItem('token', data.access);
      localStorage.setItem('userInfo', JSON.stringify(data));

      const params = new URLSearchParams(location.search);
      const redirectPath = params.get('redirect') ? `/${params.get('redirect')}` : '/';

      if (data.isAdmin || data.profile?.type === 'vendor') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = redirectPath;
      }

    } catch (err) {
      console.error("Login Error:", err);
      const errorMessage = err.response?.data?.detail || 
                           (err.response?.status === 401 ? "Invalid Email or Password" : "Server Connection Error");
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta title={`${t('login') || 'Login'} | SmartShop`} />
      
      {/* Background Shapes  */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-10 transition-all duration-300 hover:shadow-primary/10">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {t('welcomeBack') || "Welcome Back"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t('loginSubtitle') || "Enter your details to access your account"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center animate-bounce">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {t('email') || "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-bold placeholder-gray-300 dark:placeholder-gray-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                  {t('password') || "Password"}
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-orange-600 transition-colors">
                  {t('forgotPasswordLink') || "Forgot Password?"}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-bold placeholder-gray-300 dark:placeholder-gray-600"
                  placeholder="••••••••"
                />
                {/* eye but*/}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden group bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                   <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('loggingIn') || "Processing..."}</span>
                   </>
                ) : (
                  <>
                    <span>{t('loginNow') || "SIGN IN"}</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t('dontHaveAccount') || "New to our platform?"} 
              <Link to="/register" className="text-primary font-bold hover:underline ml-2">
                {t('registerHere') || "Create Account"}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;