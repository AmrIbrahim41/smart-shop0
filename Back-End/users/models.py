"""
User Models for Smart Shop E-commerce Platform
Extended user profile with customer/vendor support
"""

from django.db import models
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


class Profile(models.Model):
    """
    Extended user profile with additional information.
    Created explicitly during registration or first login.
    """
    
    USER_TYPE_CHOICES = (
        ("customer", "Customer"),
        ("vendor", "Vendor"),
    )

    # One-to-one relationship with User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    # Account type
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default="customer",
        db_index=True
    )

    # Contact Information
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_index=True
    )

    # Personal Information
    birthdate = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)

    # Profile Picture
    profile_picture = models.ImageField(
        upload_to="profiles/",
        null=True,
        blank=True
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user_type"]),
        ]

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.get_user_type_display()})"

    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.user.first_name} {self.user.last_name}".strip()