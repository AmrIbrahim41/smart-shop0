"""
Store URLs for Smart Shop E-commerce Platform

URL ORDERING RULE: Always place specific/named paths BEFORE parameterized paths
like <int:pk>. Even though Django's <int:pk> only matches integers (not strings
like 'create' or 'myproducts'), keeping this order prevents ambiguity in
`reverse()` calls and is a Django best practice.
"""

from django.urls import path
from . import views

urlpatterns = [
    # =============================================================================
    # PRODUCT VIEWS (PUBLIC)
    # =============================================================================
    path("products/", views.get_products, name="products"),
    path("products/top/", views.get_top_products, name="top-products"),
    path("products/shop-view/", views.get_products_by_category, name="shop-view"),

    # =============================================================================
    # PRODUCT MANAGEMENT (AUTHENTICATED) — specific named paths BEFORE <int:pk>
    # =============================================================================
    path("products/create/", views.create_product, name="product-create"),
    path("products/myproducts/", views.get_my_products, name="my-products"),

    # Parameterized paths come AFTER named paths
    path("products/<int:pk>/", views.get_product, name="product-detail"),
    path("products/update/<int:pk>/", views.update_product, name="product-update"),
    path("products/delete/<int:pk>/", views.delete_product, name="product-delete"),
    path("products/delete-image/<int:pk>/", views.delete_product_image, name="delete-product-image"),

    # =============================================================================
    # REVIEWS
    # =============================================================================
    path("products/<int:pk>/reviews/create/", views.create_product_review, name="create-review"),
    path("products/<int:pk>/reviews/update/", views.update_product_review, name="update-review"),
    path("products/<int:pk>/reviews/delete/", views.delete_product_review, name="delete-review"),

    # =============================================================================
    # CATEGORIES (PUBLIC) — specific paths BEFORE parameterized ones
    # =============================================================================
    path("categories/", views.get_categories, name="categories"),
    path("categories/create/", views.create_category, name="category-create"),
    path("categories/update/<int:pk>/", views.update_category, name="category-update"),
    path("categories/delete/<int:pk>/", views.delete_category, name="category-delete"),

    # =============================================================================
    # TAGS (PUBLIC) — specific paths BEFORE parameterized ones
    # =============================================================================
    path("tags/", views.get_tags, name="tags"),
    path("tags/create/", views.create_tag, name="tag-create"),
    path("tags/update/<int:pk>/", views.update_tag, name="tag-update"),
    path("tags/delete/<int:pk>/", views.delete_tag, name="tag-delete"),

    # =============================================================================
    # ORDERS (CUSTOMER) — specific named paths BEFORE <int:pk>
    # =============================================================================
    path("orders/add/", views.add_order_items, name="orders-add"),
    path("orders/myorders/", views.get_my_orders, name="myorders"),
    path("orders/export/csv/", views.export_orders_csv, name="export_orders_csv"),

    # Parameterized order paths
    path("orders/<int:pk>/", views.get_order_by_id, name="user-order"),
    path("orders/<int:pk>/pay/", views.update_order_to_paid, name="pay"),
    path("orders/<int:pk>/deliver/", views.update_order_to_delivered, name="order-delivered"),
    path("orders/delete/<int:pk>/", views.delete_order, name="delete-order"),

    # =============================================================================
    # ORDERS (ADMIN LIST) — placed last to avoid shadowing specific paths above
    # =============================================================================
    path("orders/", views.get_orders, name="orders"),

    # =============================================================================
    # CART
    # =============================================================================
    path("cart/", views.get_cart, name="cart-get"),
    path("cart/add/", views.add_to_cart, name="cart-add"),
    path("cart/update/", views.update_cart_item, name="update_cart_item"),
    path("cart/clear/", views.clear_cart, name="cart-clear"),
    path("cart/remove/<int:pk>/", views.remove_from_cart, name="cart-remove"),

    # =============================================================================
    # WISHLIST
    # =============================================================================
    path("wishlist/", views.get_wishlist, name="wishlist-get"),
    path("wishlist/toggle/", views.toggle_wishlist, name="wishlist-toggle"),

    # =============================================================================
    # ADMIN DASHBOARD
    # =============================================================================
    path("dashboard/stats/", views.get_dashboard_stats, name="dashboard-stats"),

    # =============================================================================
    # STORE SETTINGS
    # GET  api/settings/        → public, returns current settings
    # PUT  api/settings/update/ → admin only, updates settings
    # =============================================================================
    path("settings/", views.get_store_settings, name="store-settings"),
    path("settings/update/", views.update_store_settings, name="update-store-settings"),
]
