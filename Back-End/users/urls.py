from django.urls import path
from . import views

urlpatterns = [
    # --- Authentication & Profile ---
    path('login/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', views.registerUser, name='register'),
    path('profile/', views.getUserProfile, name='users-profile'),
    path('profile/update/', views.updateUserProfile, name='users-profile-update'),
    
    # --- Password Reset & Activation ---
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/<str:uid>/<str:token>/', views.reset_password, name='reset-password'),
    path('activate/<str:uid>/<str:token>/', views.activateUser, name='activate'),

    # --- Vendor ---
    path('seller/orders/', views.getSellerOrders, name='seller-orders'),

    # --- Admin Routes ---
    path('', views.getUsers, name='users'),

    # --- Admin Operations ---
    path('delete/<int:pk>/', views.deleteUser, name='user-delete'),
    path('update/<int:pk>/', views.updateUser, name='user-update'),
    path('<int:pk>/', views.getUserById, name='user-detail'), 
]