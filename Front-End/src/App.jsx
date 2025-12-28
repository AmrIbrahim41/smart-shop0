import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts & Components 
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import AdminRoute from './components/adminroute/AdminRoute';

// Public Pages
const Home = React.lazy(() => import('./pages/home/Home'));
const ShopScreen = React.lazy(() => import('./pages/home/ShopScreen'));
const ProductDetails = React.lazy(() => import('./pages/productdetails/ProductDetails'));
const WishlistScreen = React.lazy(() => import('./pages/Wishlist/WishlistScreen'));
const NotFound = React.lazy(() => import('./pages/notfound/NotFound'));

// Shipping & Order Pages
const CartScreen = React.lazy(() => import('./pages/cart/CartScreen'));
const ShippingScreen = React.lazy(() => import('./pages/shipping/ShippingScreen'));
const PlaceOrderScreen = React.lazy(() => import('./pages/shipping/PlaceOrderScreen'));
const PaymentScreen = React.lazy(() => import('./pages/shipping/PaymentScreen'));
const OrderScreen = React.lazy(() => import('./pages/shipping/OrderScreen'));

// Auth Pages
const LoginPage = React.lazy(() => import('./pages/login/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/registerPage/RegisterPage'));
const ProfileScreen = React.lazy(() => import('./pages/profile/ProfileScreen'));
const ForgotPasswordScreen = React.lazy(() => import('./pages/login/ForgotPasswordScreen'));
const ResetPasswordScreen = React.lazy(() => import('./pages/login/ResetPasswordScreen'));
const ActivationScreen = React.lazy(() => import('./pages/registerPage/ActivationScreen'));

// Seller Pages
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'));
const ProductEditScreen = React.lazy(() => import('./pages/seller/ProductEditScreen'));
const MyProducts = React.lazy(() => import('./pages/seller/MyProducts'));

// Admin Pages
const OrderListScreen = React.lazy(() => import('./pages/admin/OrderListScreen'));
const UserListScreen = React.lazy(() => import('./pages/admin/UserListScreen'));
const ProductListScreen = React.lazy(() => import('./pages/admin/ProductListScreen'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark font-sans transition-colors duration-300">
      <Toaster position="bottom-center" reverseOrder={false} />
      
      <ScrollToTop />

      <Navbar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<WishlistScreen />} />

          {/* Cart & Checkout */}
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/shipping" element={<ShippingScreen />} />
          <Route path="/placeorder" element={<PlaceOrderScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/order/:id" element={<OrderScreen />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordScreen />} />
          <Route path="/activate/:uid/:token" element={<ActivationScreen />} />
          
          {/* Product Management (Admin & Seller) */}
          <Route path="/admin/product/create" element={<ProductEditScreen />} />
          <Route path="/admin/product/:id/edit" element={<ProductEditScreen />} />
          <Route path="/seller/products/add" element={<ProductEditScreen />} />
          <Route path="/seller/product/:id/edit" element={<ProductEditScreen />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin/orderlist" element={<OrderListScreen />} />
          <Route path="/admin/users" element={<UserListScreen />} />
          <Route path="/admin/productlist" element={<ProductListScreen />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Backward Compatibility & 404 */}
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;