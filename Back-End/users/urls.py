"""
User URLs for Smart Shop E-commerce Platform
"""

from django.urls import path
from . import views

urlpatterns = [
    # =============================================================================
    # AUTHENTICATION & REGISTRATION
    # =============================================================================
    path("login/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("register/", views.registerUser, name="register"),
    path("activate/<str:uid>/<str:token>/", views.activateUser, name="activate"),
    
    # =============================================================================
    # PROFILE MANAGEMENT
    # =============================================================================
    path("profile/", views.getUserProfile, name="users-profile"),
    path("profile/update/", views.updateUserProfile, name="users-profile-update"),
    
    # =============================================================================
    # PASSWORD RESET
    # =============================================================================
    path("forgot-password/", views.forgot_password, name="forgot-password"),
    path("reset-password/<str:uid>/<str:token>/", views.reset_password, name="reset-password"),
    
    # =============================================================================
    # VENDOR OPERATIONS
    # =============================================================================
    path("seller/orders/", views.getSellerOrders, name="seller-orders"),
    
    # =============================================================================
    # ADMIN USER MANAGEMENT
    # =============================================================================
    path("", views.getUsers, name="users"),
    path("<int:pk>/", views.getUserById, name="user-detail"),
    path("update/<int:pk>/", views.updateUser, name="user-update"),
    path("delete/<int:pk>/", views.deleteUser, name="user-delete"),
]
