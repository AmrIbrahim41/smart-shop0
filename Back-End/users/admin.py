"""
User Admin Configuration for Smart Shop E-commerce Platform
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile


class ProfileInline(admin.StackedInline):
    """Inline profile editor in User admin"""
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile Information"
    fields = ("user_type", "phone", "birthdate", "city", "country", "profile_picture")


class CustomUserAdmin(BaseUserAdmin):
    """Custom User admin with profile inline"""
    inlines = (ProfileInline,)
    
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "get_user_type",
        "date_joined",
    )
    list_select_related = ("profile",)
    list_filter = ("is_staff", "is_active", "profile__user_type", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name", "profile__phone")
    ordering = ("-date_joined",)

    def get_user_type(self, instance):
        """Display user account type"""
        try:
            return instance.profile.get_user_type_display()
        except Profile.DoesNotExist:
            return "N/A"
    
    get_user_type.short_description = "Account Type"
    get_user_type.admin_order_field = "profile__user_type"


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
