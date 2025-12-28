import logging
from django.shortcuts import render
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.decorators import api_view, permission_classes, parser_classes 
from rest_framework.parsers import MultiPartParser, FormParser 

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
import os
from store.models import Order, OrderItem
from .serializers import (
    UserSerializer, 
    UserSerializerWithToken, 
    MyTokenObtainPairSerializer
)

logger = logging.getLogger(__name__)

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- User Management Views ---

@api_view(['POST'])
def registerUser(request):
    data = request.data
    try:
        if User.objects.filter(email=data['email']).exists():
            return Response({'detail': 'This email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

        # create user
        user = User.objects.create(
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            username=data['email'],
            email=data['email'],
            password=make_password(data['password']),
            is_active=False 
        )

        try:
            profile = user.profile
            profile.phone = data.get('phone', '')
            profile.user_type = data.get('type', 'customer') 
            profile.save()
        except Exception as e:
            logger.error(f"Profile update failed for user {user.email}: {e}")

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        activation_link = f'{FRONTEND_URL}/activate/{uid}/{token}/'
        
        subject = 'Activate your account - Smart Shop'
        message = f'Welcome {user.first_name}, please click the link below to activate your account:\n{activation_link}'
        
        send_mail(
            subject, 
            message, 
            settings.EMAIL_HOST_USER, 
            [data['email']], 
            fail_silently=False
        )

        return Response({'details': 'Account created successfully. Please check your email to activate.'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Registration Error: {e}")
        return Response({'detail': 'Account creation failed due to server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def activateUser(request, uid, token):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'details': 'Account activated successfully! You can login now.'})
        else:
            return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'detail': 'Invalid token or user ID'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    user = request.user
    serializer = UserSerializer(user, many=False, context={'request': request})
    return Response(serializer.data)



# في ملف views.py

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def updateUserProfile(request):
    user = request.user
    data = request.data 
    
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    
    if data.get('password') and data.get('password') != '':
        user.password = make_password(data['password'])
    
    user.save()

    profile = user.profile
    profile.phone = data.get('phone', profile.phone)
    profile.city = data.get('city', profile.city)
    profile.country = data.get('country', profile.country)
    
    if data.get('birthdate'):
        profile.birthdate = data['birthdate']
        
    profile_pic = data.get('profile_picture')
    
    if profile_pic and not isinstance(profile_pic, str):
        profile.profile_picture = profile_pic 

    profile.save()
    
    serializer = UserSerializerWithToken(user, many=False, context={'request': request})

    return Response(UserSerializerWithToken(user, many=False, context={'request': request}).data)

# --- Admin Views ---

@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUsers(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteUser(request, pk):
    try:
        user = User.objects.get(id=pk)
        user.delete()
        return Response('User was deleted')
    except User.DoesNotExist:
        return Response({'detail': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUserById(request, pk):
    try:
        user = User.objects.get(id=pk)
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'detail': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateUser(request, pk):
    try:
        user = User.objects.get(id=pk)
        data = request.data

        user.first_name = data.get('name', user.first_name)
        user.username = data.get('email', user.username)
        user.email = data.get('email', user.email)
        user.is_staff = data.get('isAdmin', user.is_staff)

        user.save()
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# --- Password Reset Views ---

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    data = request.data
    email = data.get('email', '')

    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_link = f'{FRONTEND_URL}/reset-password/{uid}/{token}/'
        
        subject = 'Password Reset Request - Smart Shop'
        message = f'Hello {user.first_name},\n\nClick the link below to reset your password:\n{reset_link}\n\nIf you did not request this, please ignore this email.'

        send_mail(
            subject, 
            message, 
            settings.EMAIL_HOST_USER, 
            [email], 
            fail_silently=False
        )

        return Response({'details': 'Reset link sent! Please check your email.'})

    except User.DoesNotExist:
        return Response({'details': 'If this email exists, a reset link has been sent.'})
    except Exception as e:
        logger.error(f"Forgot Password Error: {e}")
        return Response({'detail': 'An error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request, uid, token):
    data = request.data
    new_password = data.get('password')
    confirm_password = data.get('confirmPassword')

    if new_password != confirm_password:
        return Response({'detail': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'details': 'Password reset successful! You can login now.'})
        else:
            return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Reset Password Error: {e}")
        return Response({'detail': 'Invalid token or user ID'}, status=status.HTTP_400_BAD_REQUEST)


# --- Vendor Views (Optimized) ---

# في ملف views.py (تطبيق users)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getSellerOrders(request):
    user = request.user
    
    # التأكد من أن المستخدم بائع
    if hasattr(user, 'profile') and user.profile.user_type == 'vendor':
        
        items = OrderItem.objects.filter(product__user=user).select_related('order').order_by('-id')

        custom_orders = []
        for item in items:
            custom_orders.append({
                "_id": item.id,
                "order_id": item.order.id, 
                "name": item.name,
                "qty": item.qty,
                "price": item.price,
                "totalPrice": item.price * item.qty,                
                "createdAt": item.order.created_at,  
                "isPaid": item.order.is_paid,        
                "isDelivered": item.order.is_delivered, 
            })

        return Response(custom_orders)
    else:
        return Response({'detail': 'Not authorized as a vendor'}, status=status.HTTP_401_UNAUTHORIZED)