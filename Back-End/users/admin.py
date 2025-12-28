from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile

# 1. add profile to user 
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile Info'

class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_user_type')
    list_select_related = ('profile', ) 

    def get_user_type(self, instance):
        return instance.profile.user_type
    get_user_type.short_description = 'Account Type'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)