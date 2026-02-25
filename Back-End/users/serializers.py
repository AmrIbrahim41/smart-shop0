"""
User Serializers for Smart Shop E-commerce Platform
"""

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from .models import Profile
from store.models import OrderItem  # تأكد من صحة هذا المسار حسب تطبيقك
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# PROFILE SERIALIZER
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):
    """User profile serializer with proper image URL handling"""
    
    profile_picture = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            "user_type",
            "phone",
            "birthdate",
            "city",
            "country",
            "profile_picture",
        ]

    def get_profile_picture(self, obj):
        """Build absolute URL for profile picture"""
        try:
            if obj.profile_picture:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.profile_picture.url)
                return obj.profile_picture.url
        except Exception as e:
            logger.warning(f"Error getting profile picture URL: {str(e)}")
        return None

# =============================================================================
# USER SERIALIZERS
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer with profile data"""
    
    profile = serializers.SerializerMethodField(read_only=True)
    is_admin = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "is_admin",
            "profile",
            "date_joined",
        ]

    def get__id(self, obj):
        return obj.id

    def get_is_admin(self, obj):
        return obj.is_staff

    def get_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if not name:
            name = obj.email
        return name

    def get_profile(self, obj):
        """Safely fetch profile to avoid RelatedObjectDoesNotExist crash"""
        try:
            if hasattr(obj, 'profile'):
                return ProfileSerializer(obj.profile, context=self.context).data
            return None
        except Exception:
            return None

class UserSerializerWithToken(UserSerializer):
    """User serializer with JWT access token"""
    
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = UserSerializer.Meta.fields + ["token"]

    def get_token(self, obj):
        """Generate JWT access token"""
        token = RefreshToken.for_user(obj)
        return str(token.access_token)

# =============================================================================
# REGISTRATION SERIALIZER
# =============================================================================

class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer with password validation"""
    
    confirm_password = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    user_type = serializers.ChoiceField(
        choices=[("customer", "Customer"), ("vendor", "Vendor")],
        write_only=True,
        required=True,
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
            "phone",
            "user_type",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
        }

    def validate_email(self, value):
        """Validate email is unique"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()

    def validate_password(self, value):
        """Validate password using Django's password validators"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate password confirmation matches"""
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with profile atomically"""
        validated_data.pop("confirm_password")
        phone = validated_data.pop("phone", None)
        user_type = validated_data.pop("user_type", "customer")

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data["email"].lower(),
                email=validated_data["email"].lower(),
                password=validated_data["password"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                is_active=False,
            )

            try:
                Profile.objects.create(
                    user=user,
                    phone=phone if phone else "",
                    user_type=user_type
                )
                logger.info(f"User and Profile created: {user.id} ({user_type})")
            except Exception as e:
                logger.error(f"Error creating profile for user {user.id}: {str(e)}")
                raise serializers.ValidationError("Failed to complete profile creation.")

        return user

# =============================================================================
# CHANGE PASSWORD SERIALIZER
# =============================================================================

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change endpoint"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

# =============================================================================
# VENDOR ORDER ITEM SERIALIZER
# =============================================================================

class VendorOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='name', read_only=True)
    """Serializer for vendor orders response"""
    _id = serializers.SerializerMethodField(read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    customer = serializers.SerializerMethodField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.DateTimeField(source='order.created_at', read_only=True)
    is_paid = serializers.BooleanField(source='order.is_paid', read_only=True)
    is_delivered = serializers.BooleanField(source='order.is_delivered', read_only=True)
    status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "_id", "order_id", "customer", "product_name", "qty", 
            "price", "total_price", "created_at", "is_paid", 
            "is_delivered", "status"
        ]

    def get__id(self, obj):
        return obj.id

    def get_customer(self, obj):
        if obj.order.user:
            return f"{obj.order.user.first_name} {obj.order.user.last_name}".strip()
        return "Guest"

    def get_total_price(self, obj):
        return str(obj.price * obj.qty)

# =============================================================================
# LOGIN TOKEN SERIALIZER
# =============================================================================

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data in login response"""
    
    def validate(self, attrs):
        """Add user data to JWT token response"""
        data = super().validate(attrs)

        # Fallback profile creation if it doesn't exist
        if not hasattr(self.user, "profile"):
            Profile.objects.create(user=self.user)
            logger.info(f"Profile created for existing user {self.user.id}")

        serializer = UserSerializerWithToken(
            self.user,
            many=False,
            context={"request": self.context.get("request")}
        )

        for key, value in serializer.data.items():
            data[key] = value

        return data