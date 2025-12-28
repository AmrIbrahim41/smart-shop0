from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import Profile
from store.models import Order, OrderItem, ShippingAddress

# -------------------------
# 1. Profile Serializer 
# -------------------------
# في ملف serializers.py

class ProfileSerializer(serializers.ModelSerializer):
    profilePicture = serializers.SerializerMethodField(source='profile_picture')

    class Meta:
        model = Profile
        fields = ['user_type', 'phone', 'birthdate', 'city', 'country', 'profilePicture']

    def get_profilePicture(self, obj):
        try:
            image = obj.profile_picture
            if image:
                # 3. هذا الكود يجعل الرابط مرناً (Dynamic)
                # سيتحول تلقائياً من localhost إلى اسم موقعك عند الرفع
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(image.url)
                return image.url
        except:
            return None
# -------------------------
# 2. User Serializer
# -------------------------
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    
    isAdmin = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'first_name', 'last_name', 'name', 'isAdmin', 'profile']

    def get__id(self, obj):
        return obj.id

    def get_isAdmin(self, obj):
        return obj.is_staff
    
    def get_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if name == '':
            name = obj.email
        return name

# -------------------------
# 3. User Serializer With Token
# -------------------------
class UserSerializerWithToken(UserSerializer):
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = UserSerializer.Meta.fields + ['token']

    def get_token(self, obj):
        token = RefreshToken.for_user(obj)
        return str(token.access_token)

# -------------------------
# 4. Register Serializer
# -------------------------
class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=False)
    user_type = serializers.ChoiceField(choices=[('customer', 'Customer'), ('vendor', 'Vendor')], write_only=True, required=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password', 'phone', 'user_type']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email=attrs['email']).exists():
             raise serializers.ValidationError({"email": "Email already exists"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        phone = validated_data.pop('phone', None)
        account_type = validated_data.pop('user_type', 'customer')

        user = User.objects.create_user(
            username=validated_data['email'], 
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        if hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.user_type = account_type
            user.profile.save()
        
        return user

# -------------------------
# 5. Login Token Serializer
# -------------------------
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if not hasattr(self.user, 'profile'):
            Profile.objects.create(user=self.user)

        serializer = UserSerializerWithToken(self.user, many=False, context=self.context).data
        
        for k, v in serializer.items():
            data[k] = v
            
        return data

# -------------------------
# 6. Order Serializers
# -------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    orderItems = serializers.SerializerMethodField(read_only=True)
    shippingAddress = serializers.SerializerMethodField(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def get_orderItems(self, obj):
        items = obj.items.all()
        serializer = OrderItemSerializer(items, many=True)
        return serializer.data

    def get_shippingAddress(self, obj):
        try:
            address = ShippingAddressSerializer(obj.shippingaddress, many=False).data
        except ShippingAddress.DoesNotExist:
            address = False
        except Exception:
            address = False
        return address