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
    StoreSettings,
)
from decimal import Decimal


# =============================================================================
# USER SERIALIZER (Simple version for store app)
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Simple user serializer for store-related operations"""
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.IntegerField(source="id", read_only=True)
    is_admin = serializers.BooleanField(source="is_staff", read_only=True)

    class Meta:
        model = User
        fields = ["id", "_id", "username", "email", "name", "is_admin"]

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
            "created_at",
            "updated_at",
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

    user_name = serializers.CharField(source="user.username", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    final_price = serializers.SerializerMethodField(read_only=True)
    is_in_stock = serializers.SerializerMethodField(read_only=True)

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
            "category_slug", 
            "description",
            "rating",
            "num_reviews",
            "price",
            "discount_price",
            "final_price",
            "count_in_stock",
            "is_in_stock",
            "created_at",
            "updated_at",
            "user",
            "user_name",
            "images",
            "reviews",
            "tags",
            "is_featured",
            "is_active",
            "approval_status",
        ]

    def get_final_price(self, obj):
        """Get the actual selling price"""
        return str(obj.final_price)

    def get_is_in_stock(self, obj):
        """Check if product is available"""
        return obj.is_in_stock


class SimpleProductSerializer(serializers.ModelSerializer):
    """Lightweight product serializer for cart/wishlist"""
    final_price = serializers.SerializerMethodField(read_only=True)
    is_in_stock = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "price",
            "discount_price",
            "final_price",
            "count_in_stock",
            "is_in_stock",
        ]

    def get_final_price(self, obj):
        return str(obj.final_price)

    def get_is_in_stock(self, obj):
        return obj.is_in_stock


# =============================================================================
# ORDER SERIALIZERS
# =============================================================================

class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    total_price = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "name", "qty", "price", "image", "total_price"]

    def get_total_price(self, obj):
        """Calculate line item total"""
        return str(obj.total_price)


class ShippingAddressSerializer(serializers.ModelSerializer):
    """Shipping address serializer"""

    class Meta:
        model = ShippingAddress
        fields = ["address", "city", "postal_code", "country", "phone"]


class OrderSerializer(serializers.ModelSerializer):
    """Complete order serializer"""
    order_items = OrderItemSerializer(source="items", many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "payment_method",
            "payment_id",
            "tax_price",
            "shipping_price",
            "total_price",
            "is_paid",
            "paid_at",
            "is_delivered",
            "delivered_at",
            "created_at",
            "updated_at",
            "order_items",
            "shipping_address",
            "status",
            "tracking_number",
        ]


# =============================================================================
# CART & WISHLIST SERIALIZERS
# =============================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Cart item serializer with product details"""
    product_details = SimpleProductSerializer(source="product", read_only=True)
    item_total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_details", "qty", "item_total"]

    def get_item_total(self, obj):
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


# =============================================================================
# STORE SETTINGS SERIALIZER
# =============================================================================

class StoreSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for the StoreSettings singleton.

    All fields are optional on PATCH/PUT so the admin can update
    individual values without re-sending the whole object.
    `updated_at` is read-only.
    """

    class Meta:
        model = StoreSettings
        fields = [
            "tax_rate",
            "shipping_cost",
            "free_shipping_threshold",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_tax_rate(self, value):
        if value < Decimal("0") or value > Decimal("1"):
            raise serializers.ValidationError(
                "tax_rate must be between 0.0000 and 1.0000 (e.g. 0.08 for 8%)."
            )
        return value

    def validate_shipping_cost(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError("shipping_cost cannot be negative.")
        return value

    def validate_free_shipping_threshold(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError(
                "free_shipping_threshold cannot be negative."
            )
        return value
