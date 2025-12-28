from django.urls import path
from . import views

urlpatterns = [
    # -------------------------
    # 1. Products (الروابط العامة)
    # -------------------------
    path("products/", views.get_products, name="products"),
    path("products/top/", views.get_top_products, name="top-products"), 
    path("products/shop-view/", views.get_products_by_category, name="shop-view"),

    # -------------------------
    # 1.1. Product Creation & User's Products
    # -------------------------
    path("products/create/", views.create_product, name="product-create"),
    path("products/myproducts/", views.get_my_products, name="my-products"),

    # -------------------------
    # 2. Product Details
    # -------------------------
    path("products/<str:pk>/", views.get_product, name="product-detail"),
    path("products/<str:pk>/reviews/create/", views.create_product_review, name="create-review"),
    path("products/<str:pk>/reviews/update/", views.update_product_review, name="update-review"),

    # -------------------------
    # 3. Product Operations (Update & Delete)
    # -------------------------
    path("products/update/<str:pk>/", views.update_product, name="product-update"),
    path("products/delete/<str:pk>/", views.delete_product, name="product-delete"),
    path("products/delete-image/<str:pk>/", views.delete_product_image, name="delete-product-image"),

    # -------------------------
    # 4. Categories & Others
    # -------------------------
    path("categories/", views.get_categories, name="categories"),

    # -------------------------
    # 5. Admin & Orders
    # -------------------------
    path("orders/add/", views.add_order_items, name="orders-add"),
    path("orders/", views.get_orders, name="orders"),
    path("orders/myorders/", views.get_my_orders, name="myorders"),
    path("orders/<str:pk>/", views.get_order_by_id, name="user-order"),
    path("orders/<str:pk>/pay/", views.update_order_to_paid, name="pay"),
    path("orders/<str:pk>/deliver/", views.update_order_to_delivered, name="order-delivered"),
    path("orders/delete/<str:pk>/", views.delete_order, name="delete-order"),
    path("dashboard/stats/", views.get_dashboard_stats, name="dashboard-stats"),
    path('orders/export/csv/', views.export_orders_csv, name='export_orders_csv'),

    # -------------------------
    # 6. Cart & Wishlist
    # -------------------------
    path("cart/", views.get_cart, name="cart-get"),
    path("cart/add/", views.add_to_cart, name="cart-add"),
    path("cart/remove/<str:pk>/", views.remove_from_cart, name="cart-remove"),
    path("cart/clear/", views.clear_cart, name="cart-clear"), 
    path('cart/update/', views.update_cart_item, name='update_cart_item'),
    
    path("wishlist/", views.get_wishlist, name="wishlist-get"),
    path("wishlist/toggle/", views.toggle_wishlist, name="wishlist-toggle"),
    # -------------------------
    # 8. Tags Management 
    # -------------------------
    path("tags/", views.get_tags, name="tags"),
    path("tags/create/", views.create_tag, name="tag-create"),
    path("tags/update/<str:pk>/", views.update_tag, name="tag-update"),
    path("tags/delete/<str:pk>/", views.delete_tag, name="tag-delete"),
    # -------------------------
    # 9. Admin Categories 
    # -------------------------
    path("categories/create/", views.create_category, name="category-create"),
    path("categories/update/<str:pk>/", views.update_category, name="category-update"),
    path("categories/delete/<str:pk>/", views.delete_category, name="category-delete"),
]