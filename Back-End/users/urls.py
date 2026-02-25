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
    path("register/", views.register_user, name="register"),
    path("activate/<str:uid>/<str:token>/", views.activate_user, name="activate"),
    
    # =============================================================================
    # PROFILE MANAGEMENT
    # =============================================================================
    path("profile/", views.get_user_profile, name="users-profile"),
    path("profile/update/", views.update_user_profile, name="users-profile-update"),
    path("profile/change-password/", views.change_password, name="user-change-password"),
    
    # =============================================================================
    # PASSWORD RESET
    # =============================================================================
    path("forgot-password/", views.forgot_password, name="forgot-password"),
    path("reset-password/<str:uid>/<str:token>/", views.reset_password, name="reset-password"),
       
    # =============================================================================
    # ADMIN USER MANAGEMENT
    # =============================================================================
    path("", views.get_users, name="users"),
    path("<int:pk>/", views.get_user_by_id, name="user-detail"),
    path("update/<int:pk>/", views.update_user, name="user-update"),
    path("delete/<int:pk>/", views.delete_user, name="user-delete"),
]