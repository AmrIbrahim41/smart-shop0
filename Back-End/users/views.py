"""
User Views for Smart Shop E-commerce Platform
Authentication, Profile Management, Password Reset, and Vendor Operations
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView

from store.models import OrderItem
from .serializers import (
    UserSerializer,
    UserSerializerWithToken,
    MyTokenObtainPairSerializer,
)
from .models import Profile

logger = logging.getLogger(__name__)


# =============================================================================
# JWT TOKEN VIEW
# =============================================================================

class MyTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view with user data"""
    serializer_class = MyTokenObtainPairSerializer


# =============================================================================
# USER REGISTRATION & ACTIVATION
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user with email activation.
    Creates inactive user until email is verified.
    """
    data = request.data

    # Validate required fields
    required_fields = ["email", "password", "first_name"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        return Response(
            {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = data["email"].lower().strip()

    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "This email is already registered."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate password
    password = data.get("password")
    try:
        validate_password(password)
    except DjangoValidationError as e:
        return Response(
            {"detail": list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            # Create user (inactive until email verification)
            user = User.objects.create(
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                username=email,
                email=email,
                password=make_password(password),
                is_active=False,
            )

            # Update profile
            try:
                profile = user.profile
                profile.phone = data.get("phone", "")
                profile.user_type = data.get("type", "customer")
                profile.save()
            except Exception as e:
                logger.error(f"Profile update failed for user {user.email}: {str(e)}")
                raise Exception("Profile creation failed")

            # Generate activation token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Build activation link
        frontend_url = settings.FRONTEND_URL
        activation_link = f"{frontend_url}/activate/{uid}/{token}/"

        # Send activation email
        subject = "Activate your Smart Shop account"
        message = f"""
Hello {user.first_name},

Welcome to Smart Shop! Please click the link below to activate your account:

{activation_link}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
Smart Shop Team
"""

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            logger.info(f"Activation email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send activation email to {email}: {str(e)}")
            return Response(
                {
                    "detail": "Account created but failed to send activation email. Please contact support."
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "detail": "Account created successfully. Please check your email to activate your account."
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {"detail": "Account creation failed. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def activate_user(request, uid, token):
    """Activate user account using email verification token"""
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            if user.is_active:
                return Response(
                    {"detail": "Account is already activated."},
                    status=status.HTTP_200_OK
                )

            user.is_active = True
            user.save()
            logger.info(f"User activated: {user.id}")
            return Response(
                {"detail": "Account activated successfully! You can now log in."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Invalid or expired activation link."},
                status=status.HTTP_400_BAD_REQUEST
            )

    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"detail": "Invalid activation link."},
            status=status.HTTP_400_BAD_REQUEST
        )


# =============================================================================
# PROFILE MANAGEMENT
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user's profile"""
    user = request.user
    serializer = UserSerializer(user, many=False, context={"request": request})
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_user_profile(request):
    """Update current user's profile"""
    user = request.user
    data = request.data

    # Update user fields
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)

    # Update password if provided
    if data.get("password") and data.get("password") != "":
        password = data["password"]
        
        try:
            validate_password(password)
            user.password = make_password(password)
        except DjangoValidationError as e:
            return Response(
                {"detail": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

    try:
        with transaction.atomic():
            user.save()
            
            # Update profile
            profile = user.profile
            profile.phone = data.get("phone", profile.phone)
            profile.city = data.get("city", profile.city)
            profile.country = data.get("country", profile.country)

            if data.get("birthdate"):
                profile.birthdate = data["birthdate"]

            profile_pic = request.FILES.get("profile_picture") or data.get("profile_picture")
            if profile_pic and not isinstance(profile_pic, str):
                profile.profile_picture = profile_pic

            profile.save()
            logger.info(f"Profile updated for user {user.id}")

    except Exception as e:
        logger.error(f"Error updating user/profile {user.id}: {str(e)}")
        return Response(
            {"detail": "Failed to update profile."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = UserSerializerWithToken(user, many=False, context={"request": request})
    return Response(serializer.data)


# =============================================================================
# PASSWORD RESET
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email"""
    email = request.data.get("email", "").lower().strip()

    if not email:
        return Response(
            {"detail": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # التعديل الهام: استخدام filter بدلاً من get
    user = User.objects.filter(email=email).first()
        
    if user:
        # Generate reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Build reset link
        frontend_url = settings.FRONTEND_URL
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"

        # Send reset email
        subject = "Password Reset Request - Smart Shop"
        message = f"""
Hello {user.first_name},

You requested to reset your password for your Smart Shop account.

Click the link below to reset your password:

{reset_link}

This link will expire in 24 hours.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Smart Shop Team
"""

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send reset email to {email}: {str(e)}")

    # Always return success message (security best practice)
    return Response(
        {"detail": "If this email exists, a password reset link has been sent."},
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request, uid, token):
    """Reset password using token from email"""
    data = request.data
    new_password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not new_password or not confirm_password:
        return Response(
            {"detail": "Both password fields are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_password != confirm_password:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate password strength
    try:
        validate_password(new_password)
    except DjangoValidationError as e:
        return Response(
            {"detail": list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            logger.info(f"Password reset successful for user {user.id}")
            return Response(
                {"detail": "Password reset successful! You can now log in."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )

    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"detail": "Invalid reset link."},
            status=status.HTTP_400_BAD_REQUEST
        )


# =============================================================================
# ADMIN USER MANAGEMENT
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_users(request):
    """Get all users (admin only) - With Pagination"""
    users = User.objects.select_related("profile").all().order_by("-date_joined")
    
    page = request.query_params.get('page', 1)
    paginator = Paginator(users, 10) 
    
    try:
        users_page = paginator.page(page)
    except PageNotAnInteger:
        users_page = paginator.page(1)
    except EmptyPage:
        users_page = paginator.page(paginator.num_pages)
        
    serializer = UserSerializer(users_page, many=True, context={"request": request})
    
    return Response({
        'users': serializer.data,
        'page': int(page),
        'pages': paginator.num_pages,
        'count': paginator.count
    })


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user(request, pk):
    """Delete user (admin only)"""
    try:
        user = User.objects.get(id=pk)
        
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response(
                {"detail": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_email = user.email
        user.delete()
        logger.info(f"User deleted: {pk} ({user_email}) by admin {request.user.id}")
        return Response({"detail": "User deleted successfully."})

    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_user_by_id(request, pk):
    """Get user by ID (admin only)"""
    try:
        user = User.objects.select_related("profile").get(id=pk)
        serializer = UserSerializer(user, many=False, context={"request": request})
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_user(request, pk):
    """Update user (admin only)"""
    try:
        user = User.objects.get(id=pk)
        data = request.data

        user.first_name = data.get("name", user.first_name)
        user.email = data.get("email", user.email)
        user.username = data.get("email", user.username)
        
        # Update admin status
        is_admin = data.get("is_admin", user.is_staff)
        if isinstance(is_admin, str):
            is_admin = is_admin.lower() in ("true", "1", "yes")
        user.is_staff = is_admin

        user.save()
        logger.info(f"User updated: {pk} by admin {request.user.id}")

        serializer = UserSerializer(user, many=False, context={"request": request})
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )


# =============================================================================
# VENDOR VIEWS
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_seller_orders(request):
    """
    Get all orders containing products from the current vendor.
    Returns individual order items, not complete orders.
    """
    user = request.user

    if not hasattr(user, "profile") or user.profile.user_type != "vendor":
        return Response(
            {"detail": "Access denied. Vendor account required."},
            status=status.HTTP_403_FORBIDDEN
        )

    items = (
        OrderItem.objects.filter(product__user=user)
        .select_related("order", "order__user", "product")
        .order_by("-order__created_at")
    )

    custom_orders = []
    for item in items:
        custom_orders.append({
            "_id": item.id,
            "order_id": item.order.id,
            "customer": f"{item.order.user.first_name} {item.order.user.last_name}".strip() if item.order.user else "Guest",
            "product_name": item.name,
            "qty": item.qty,
            "price": str(item.price),
            "total_price": str(item.price * item.qty),
            "created_at": item.order.created_at.isoformat(),
            "is_paid": item.order.is_paid,
            "is_delivered": item.order.is_delivered,
            "status": item.order.status,
        })

    logger.info(f"Vendor {user.id} accessed their orders: {len(custom_orders)} items")
    return Response(custom_orders)