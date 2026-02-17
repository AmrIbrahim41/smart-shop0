"""
User Serializers for Smart Shop E-commerce Platform
"""

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Profile
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# PROFILE SERIALIZER
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):
    """User profile serializer with proper image URL handling"""
    
    profilePicture = serializers.SerializerMethodField(read_only=True)
    userType = serializers.CharField(source="user_type")

    class Meta:
        model = Profile
        fields = [
            "userType",
            "phone",
            "birthdate",
            "city",
            "country",
            "profilePicture",
        ]

    def get_profilePicture(self, obj):
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
    
    profile = ProfileSerializer(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)
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
            "isAdmin",
            "profile",
        ]

    def get__id(self, obj):
        return obj.id

    def get_isAdmin(self, obj):
        return obj.is_staff

    def get_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if not name:
            name = obj.email
        return name


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
        """Create user with profile"""
        # Remove non-User fields
        validated_data.pop("confirm_password")
        phone = validated_data.pop("phone", None)
        user_type = validated_data.pop("user_type", "customer")

        # Create user
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            is_active=False,  # Requires email activation
        )

        # Update profile
        try:
            profile = user.profile
            if phone:
                profile.phone = phone
            profile.user_type = user_type
            profile.save()
            logger.info(f"User created: {user.id} ({user_type})")
        except Exception as e:
            logger.error(f"Error updating profile for user {user.id}: {str(e)}")

        return user


# =============================================================================
# LOGIN TOKEN SERIALIZER
# =============================================================================

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data in login response"""
    
    def validate(self, attrs):
        """Add user data to JWT token response"""
        data = super().validate(attrs)

        # Ensure profile exists
        if not hasattr(self.user, "profile"):
            Profile.objects.create(user=self.user)
            logger.info(f"Profile created for existing user {self.user.id}")

        # Add user serializer data to response
        serializer = UserSerializerWithToken(
            self.user,
            many=False,
            context={"request": self.context.get("request")}
        )

        for key, value in serializer.data.items():
            data[key] = value

        return data
