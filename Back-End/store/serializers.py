from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *

# ---------------------------------------------------------
# 1. User Serializer
# ---------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.IntegerField(source='id', read_only=True)
    isAdmin = serializers.BooleanField(source='is_staff', read_only=True)

    class Meta:
        model = User
        fields = ["id", "_id", "username", "email", "name", "isAdmin"]

    def get_name(self, obj):
        name = obj.first_name
        if not name:
            name = obj.email
        return name

# ---------------------------------------------------------
# 2. Category & Tags
# ---------------------------------------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

# ---------------------------------------------------------
# 3. Reviews
# ---------------------------------------------------------
class ReviewSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "createdAt", "user_name","user"]

    def get_user_name(self, obj):
        return obj.user.first_name if obj.user else "Anonymous"

# ---------------------------------------------------------
# 4. Products
# ---------------------------------------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]

class ProductSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    countInStock = serializers.IntegerField(source='count_in_stock')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    numReviews = serializers.IntegerField(source='num_reviews', read_only=True)
    isFeatured = serializers.BooleanField(source='is_featured')
    
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'image', 'brand', 'category', 'category_name', 
            'description', 'rating', 'numReviews', 'price', 'discount_price',
            'countInStock', 'createdAt', 'user', 'user_name', 'images', 
            'reviews', 'tags', 'isFeatured', 'approval_status'
        ]

# ---------------------------------------------------------
# 5. Orders Helper Serializers
# ---------------------------------------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"

class ShippingAddressSerializer(serializers.ModelSerializer):
    postalCode = serializers.CharField(source='postal_code')
    
    class Meta:
        model = ShippingAddress
        fields = ['address', 'city', 'postalCode', 'country']

# ---------------------------------------------------------
# 6. Order Serializer
# ---------------------------------------------------------
class OrderSerializer(serializers.ModelSerializer):
    orderItems = OrderItemSerializer(source='items', many=True, read_only=True)
    shippingAddress = ShippingAddressSerializer(source='shipping_address', read_only=True)
    user = UserSerializer(read_only=True)
    
    paymentMethod = serializers.CharField(source='payment_method')
    taxPrice = serializers.DecimalField(source='tax_price', max_digits=10, decimal_places=2)
    shippingPrice = serializers.DecimalField(source='shipping_price', max_digits=10, decimal_places=2)
    totalPrice = serializers.DecimalField(source='total_price', max_digits=10, decimal_places=2)
    isPaid = serializers.BooleanField(source='is_paid')
    paidAt = serializers.DateTimeField(source='paid_at')
    isDelivered = serializers.BooleanField(source='is_delivered')
    deliveredAt = serializers.DateTimeField(source='delivered_at')
    createdAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'paymentMethod', 'taxPrice', 'shippingPrice', 
            'totalPrice', 'isPaid', 'paidAt', 'isDelivered', 'deliveredAt', 
            'createdAt', 'orderItems', 'shippingAddress', 'status'
        ]

# ---------------------------------------------------------
# 7. Cart & Wishlist (Optimized)
# ---------------------------------------------------------

class SimpleProductSerializer(serializers.ModelSerializer):
    countInStock = serializers.IntegerField(source='count_in_stock')
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'image', 'price','discount_price', 'countInStock', 'slug']

class CartItemSerializer(serializers.ModelSerializer):
    product_details = SimpleProductSerializer(source="product", read_only=True)
    qty = serializers.IntegerField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_details", "qty"]

class WishlistItemSerializer(serializers.ModelSerializer):
    product_details = SimpleProductSerializer(source="product", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_details"]