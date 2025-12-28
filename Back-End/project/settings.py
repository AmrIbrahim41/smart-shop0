"""
Django settings for project project.
"""

import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------
#  Security & Environment Config (Clean Code Pattern)
# ---------------------------------------------------------

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-default-key-for-dev")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

# تعريف رابط الفرونت إند ديناميكياً
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# ---------------------------------------------------------
#  Application Definition
# ---------------------------------------------------------

INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "users.apps.UsersConfig",
    "store.apps.StoreConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", 
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "project.wsgi.application"

# ---------------------------------------------------------
#  Database
# ---------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------
#  Password Validation
# ---------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------
#  Internationalization
# ---------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------
#  Static & Media Files (Cleaned & Consolidated)
# ---------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/images/"
MEDIA_ROOT = os.path.join(BASE_DIR, "static/images")



# ---------------------------------------------------------
#  REST Framework & JWT
# ---------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=30), 
    "REFRESH_TOKEN_LIFETIME": timedelta(days=60),
}

# ---------------------------------------------------------
#  CORS Configuration
# ---------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    FRONTEND_URL, 
]

if os.environ.get("ADDITIONAL_CORS"):
    CORS_ALLOWED_ORIGINS.extend(os.environ.get("ADDITIONAL_CORS").split(","))

CORS_ALLOW_CREDENTIALS = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------
#  Email Configuration
# ---------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_USER", "amrhima41@gmail.com") 
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_PASSWORD", "wgvt zlhh vklo xedi")



JAZZMIN_SETTINGS = {
    "site_title": "Smart Shop Admin",
    "site_header": "Smart Shop",
    "site_brand": "Smart Shop",
    "welcome_sign": "Welcome to Smart Shop Dashboard",
    "copyright": "Smart Shop Ltd",
    "search_model": "auth.User",

    "topmenu_links": [
        {"name": "Home",  "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "View Site", "url": "/"}, # رابط لفتح الموقع
    ],
    
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "store.Product": "fas fa-box-open",
        "store.Order": "fas fa-shopping-cart",
        "store.Category": "fas fa-tags",
    },
    
    "order_with_respect_to": ["store", "users", "auth"],
    
    "show_ui_builder": True, 
}

JAZZMIN_UI_TWEAKS = {
    "theme": "flatly", 
    # "dark_mode_theme": "darkly",
}