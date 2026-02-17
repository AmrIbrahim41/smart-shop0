"""
Store Serializers for Smart Shop E-commerce Platform
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category,
    Tag,
    Product,
    ProductImage,
    Review,
    Order,
    OrderItem,
    ShippingAddress,
    CartItem,
    WishlistItem,
)
from decimal import Decimal


# =============================================================================
# USER SERIALIZER (Simple version for store app)
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Simple user serializer for store-related operations"""
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.IntegerField(source="id", read_only=True)
    isAdmin = serializers.BooleanField(source="is_staff", read_only=True)

    class Meta:
        model = User
        fields = ["id", "_id", "username", "email", "name", "isAdmin"]

    def get_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if not name:
            name = obj.email
        return name


# =============================================================================
# CATEGORY & TAG SERIALIZERS
# =============================================================================

class CategorySerializer(serializers.ModelSerializer):
    """Category serializer with product count"""
    product_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "product_count"]

    def get_product_count(self, obj):
        """Get count of approved products in this category"""
        return obj.products.filter(approval_status="approved", is_active=True).count()


class TagSerializer(serializers.ModelSerializer):
    """Tag serializer for product filtering"""
    
    class Meta:
        model = Tag
        fields = ["id", "name"]


# =============================================================================
# REVIEW SERIALIZER
# =============================================================================

class ReviewSerializer(serializers.ModelSerializer):
    """Product review serializer"""
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "comment",
            "user_id",
            "user_name",
            "createdAt",
            "updatedAt",
        ]

    def get_user_name(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.username
        return "Anonymous"


# =============================================================================
# PRODUCT SERIALIZERS
# =============================================================================

class ProductImageSerializer(serializers.ModelSerializer):
    """Product image serializer for gallery"""
    
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text"]


class ProductSerializer(serializers.ModelSerializer):
    """Complete product serializer with all related data"""
    reviews = ReviewSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    countInStock = serializers.IntegerField(source="count_in_stock")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    numReviews = serializers.IntegerField(source="num_reviews", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured")
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    user_name = serializers.CharField(source="user.username", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    finalPrice = serializers.SerializerMethodField(read_only=True)
    isInStock = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "brand",
            "category",
            "category_name",
            "description",
            "rating",
            "numReviews",
            "price",
            "discount_price",
            "finalPrice",
            "countInStock",
            "isInStock",
            "createdAt",
            "updatedAt",
            "user",
            "user_name",
            "images",
            "reviews",
            "tags",
            "isFeatured",
            "isActive",
            "approval_status",
        ]

    def get_finalPrice(self, obj):
        """Get the actual selling price"""
        return str(obj.final_price)

    def get_isInStock(self, obj):
        """Check if product is available"""
        return obj.is_in_stock


class SimpleProductSerializer(serializers.ModelSerializer):
    """Lightweight product serializer for cart/wishlist"""
    countInStock = serializers.IntegerField(source="count_in_stock")
    finalPrice = serializers.SerializerMethodField(read_only=True)
    isInStock = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "price",
            "discount_price",
            "finalPrice",
            "countInStock",
            "isInStock",
        ]

    def get_finalPrice(self, obj):
        return str(obj.final_price)

    def get_isInStock(self, obj):
        return obj.is_in_stock


# =============================================================================
# ORDER SERIALIZERS
# =============================================================================

class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    totalPrice = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "name", "qty", "price", "image", "totalPrice"]

    def get_totalPrice(self, obj):
        """Calculate line item total"""
        return str(obj.total_price)


class ShippingAddressSerializer(serializers.ModelSerializer):
    """Shipping address serializer"""
    postalCode = serializers.CharField(source="postal_code")

    class Meta:
        model = ShippingAddress
        fields = ["address", "city", "postalCode", "country", "phone"]


class OrderSerializer(serializers.ModelSerializer):
    """Complete order serializer"""
    orderItems = OrderItemSerializer(source="items", many=True, read_only=True)
    shippingAddress = ShippingAddressSerializer(
        source="shipping_address", read_only=True
    )
    user = UserSerializer(read_only=True)

    paymentMethod = serializers.CharField(source="payment_method")
    taxPrice = serializers.DecimalField(
        source="tax_price", max_digits=10, decimal_places=2
    )
    shippingPrice = serializers.DecimalField(
        source="shipping_price", max_digits=10, decimal_places=2
    )
    totalPrice = serializers.DecimalField(
        source="total_price", max_digits=10, decimal_places=2
    )
    isPaid = serializers.BooleanField(source="is_paid")
    paidAt = serializers.DateTimeField(source="paid_at", allow_null=True)
    isDelivered = serializers.BooleanField(source="is_delivered")
    deliveredAt = serializers.DateTimeField(source="delivered_at", allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "paymentMethod",
            "payment_id",
            "taxPrice",
            "shippingPrice",
            "totalPrice",
            "isPaid",
            "paidAt",
            "isDelivered",
            "deliveredAt",
            "createdAt",
            "updatedAt",
            "orderItems",
            "shippingAddress",
            "status",
            "tracking_number",
        ]


# =============================================================================
# CART & WISHLIST SERIALIZERS
# =============================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Cart item serializer with product details"""
    product_details = SimpleProductSerializer(source="product", read_only=True)
    itemTotal = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_details", "qty", "itemTotal"]

    def get_itemTotal(self, obj):
        """Calculate cart item total"""
        if obj.product:
            return str(obj.product.final_price * Decimal(str(obj.qty)))
        return "0.00"

    def validate_qty(self, value):
        """Validate quantity is positive"""
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class WishlistItemSerializer(serializers.ModelSerializer):
    """Wishlist item serializer with product details"""
    product_details = SimpleProductSerializer(source="product", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_details", "created_at"]
