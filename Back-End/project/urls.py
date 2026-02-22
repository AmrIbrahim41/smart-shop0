"""
Main URL Configuration for Smart Shop E-commerce Platform

FIX: The original file included store.urls TWICE:
    path('api/', include('store.urls')),   ← correct
    path('', include('store.urls')),       ← WRONG — created duplicate routes at root

This caused all store endpoints to respond on BOTH:
    /api/products/   (correct, expected by frontend)
    /products/       (duplicate, unexpected, potential security confusion)

The root-level inclusion has been removed.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # User authentication and management
    path('api/users/', include('users.urls')),

    # Store endpoints — all prefixed with /api/
    path('api/', include('store.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
