import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the Bearer token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null;

    const token = userInfo?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getImageUrl = (imgPath) => {
  if (!imgPath) return "/placeholder.jpg";
  if (imgPath.startsWith("http")) return imgPath;

  let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

  if (!cleanPath.startsWith("media/")) {
    cleanPath = `media/${cleanPath}`;
  }

  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

export const ENDPOINTS = {
  // Auth & Users
  LOGIN: "api/users/login/",
  REGISTER: "api/users/register/",
  USER_PROFILE: "api/users/profile/",
  PROFILE_UPDATE: "api/users/profile/update/",

  // Seller orders live in the store app (not users app)
  SELLER_ORDERS: "api/orders/seller-orders/",

  // Products
  PRODUCTS: "api/products/",
  TOP_PRODUCTS: "api/products/top/",
  MY_PRODUCTS: "api/products/myproducts/",
  PRODUCT_DETAILS: (id) => `api/products/${id}/`,
  CREATE_PRODUCT: "api/products/create/",
  UPDATE_PRODUCT: (id) => `api/products/update/${id}/`,
  DELETE_PRODUCT: (id) => `api/products/delete/${id}/`,
  DELETE_GALLERY_IMAGE: (id) => `api/products/delete-image/${id}/`,

  // Categories & Tags
  CATEGORIES: "api/categories/",
  CREATE_CATEGORY: "api/categories/create/",
  UPDATE_CATEGORY: (id) => `api/categories/update/${id}/`,
  DELETE_CATEGORY: (id) => `api/categories/delete/${id}/`,

  TAGS: "api/tags/",
  CREATE_TAG: "api/tags/create/",
  UPDATE_TAG: (id) => `api/tags/update/${id}/`,
  DELETE_TAG: (id) => `api/tags/delete/${id}/`,

  // Orders & Cart
  CART: "api/cart/",
  WISHLIST: "api/wishlist/",
  ORDERS_LIST: "api/orders/",
  MY_ORDERS: "api/orders/myorders/",
  CREATE_ORDER: "api/orders/add/",
  ORDER_DETAILS: (id) => `api/orders/${id}/`,
  DELETE_ORDER: (id) => `api/orders/delete/${id}/`,
  PAY_ORDER: (id) => `api/orders/${id}/pay/`,
  DELIVER_ORDER: (id) => `api/orders/${id}/deliver/`,

  // Dashboard
  DASHBOARD_STATS: "api/dashboard/stats/",

  // Store Settings
  // GET  → public (anyone can read settings for cart/checkout calculations)
  // PUT  → admin only (updates persisted in the database)
  STORE_SETTINGS: "api/settings/",
  UPDATE_STORE_SETTINGS: "api/settings/update/",
};

export const apiService = {
  // --- Auth ---
  login: (data) => api.post(ENDPOINTS.LOGIN, data),
  register: (data) => api.post(ENDPOINTS.REGISTER, data),
  getProfile: () => api.get(ENDPOINTS.USER_PROFILE),
  updateProfile: (data) => api.put(ENDPOINTS.PROFILE_UPDATE, data),

  // --- Seller orders — store app endpoint ---
  // Accepts an optional page number for DRF pagination (defaults to 1)
  getSellerOrders: (page = 1) =>
    api.get(ENDPOINTS.SELLER_ORDERS, { params: { page } }),

  // --- Products ---
  getProducts: (params) => api.get(ENDPOINTS.PRODUCTS, { params }),
  getTopProducts: () => api.get(ENDPOINTS.TOP_PRODUCTS),
  // Accepts an optional page number for DRF pagination
  getMyProducts: (page = 1) =>
    api.get(ENDPOINTS.MY_PRODUCTS, { params: { page } }),
  getProductDetails: (id) => api.get(ENDPOINTS.PRODUCT_DETAILS(id)),
  createProduct: (data) => api.post(ENDPOINTS.CREATE_PRODUCT, data),
  updateProduct: (id, data) => api.put(ENDPOINTS.UPDATE_PRODUCT(id), data),
  deleteProduct: (id) => api.delete(ENDPOINTS.DELETE_PRODUCT(id)),
  deleteProductImage: (id) => api.delete(ENDPOINTS.DELETE_GALLERY_IMAGE(id)),

  // --- Categories & Tags ---
  getCategories: () => api.get(ENDPOINTS.CATEGORIES),
  createCategory: (data) => api.post(ENDPOINTS.CREATE_CATEGORY, data),
  updateCategory: (id, data) => api.put(ENDPOINTS.UPDATE_CATEGORY(id), data),
  deleteCategory: (id) => api.delete(ENDPOINTS.DELETE_CATEGORY(id)),

  getTags: () => api.get(ENDPOINTS.TAGS),
  createTag: (data) => api.post(ENDPOINTS.CREATE_TAG, data),
  updateTag: (id, data) => api.put(ENDPOINTS.UPDATE_TAG(id), data),
  deleteTag: (id) => api.delete(ENDPOINTS.DELETE_TAG(id)),

  // --- Orders & Cart ---
  getCart: () => api.get(ENDPOINTS.CART),
  getWishlist: () => api.get(ENDPOINTS.WISHLIST),
  createOrder: (data) => api.post(ENDPOINTS.CREATE_ORDER, data),
  getOrders: (page = 1) =>
    api.get(ENDPOINTS.ORDERS_LIST, { params: { page } }),
  // Accepts an optional page number for DRF pagination
  getMyOrders: (page = 1) =>
    api.get(ENDPOINTS.MY_ORDERS, { params: { page } }),
  getOrderDetails: (id) => api.get(ENDPOINTS.ORDER_DETAILS(id)),
  payOrder: (id, paymentResult) =>
    api.put(ENDPOINTS.PAY_ORDER(id), paymentResult),
  deliverOrder: (id) => api.put(ENDPOINTS.DELIVER_ORDER(id)),
  deleteOrder: (id) => api.delete(ENDPOINTS.DELETE_ORDER(id)),

  // --- Dashboard ---
  getDashboardStats: () => api.get(ENDPOINTS.DASHBOARD_STATS),

  // --- Store Settings ---
  /**
   * Fetch current store settings (tax_rate, shipping_cost, free_shipping_threshold).
   * Public endpoint — no auth required.
   */
  getStoreSettings: () => api.get(ENDPOINTS.STORE_SETTINGS),

  /**
   * Persist updated settings to the database.
   * Admin-only endpoint. Accepts partial payloads.
   *
   * @param {Object} data - e.g. { tax_rate: "0.1000", shipping_cost: "75.00" }
   */
  updateStoreSettings: (data) => api.put(ENDPOINTS.UPDATE_STORE_SETTINGS, data),
};

export const links = {
  facebook: "https://www.facebook.com/YourPage",
  instagram: "https://www.instagram.com/YourProfile",
  whatsapp: "https://wa.me/YourNumber",
};

export default api;
