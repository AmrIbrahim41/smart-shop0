"""
Store Admin Configuration for Smart Shop E-commerce Platform
"""

from django.contrib import admin
from django.utils.html import format_html
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


# =============================================================================
# INLINE ADMINS
# =============================================================================

class ProductImageInline(admin.TabularInline):
    """Inline admin for product images"""
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text")


class OrderItemInline(admin.TabularInline):
    """Inline admin for order items"""
    model = OrderItem
    readonly_fields = ["product", "name", "qty", "price", "get_line_total"]
    can_delete = False
    extra = 0
    fields = ("product", "name", "qty", "price", "get_line_total")

    def get_line_total(self, obj):
        """Display line item total"""
        return f"${obj.total_price}"
    
    get_line_total.short_description = "Line Total"


class ShippingAddressInline(admin.StackedInline):
    """Inline admin for shipping address"""
    model = ShippingAddress
    can_delete = False
    fields = ("address", "city", "postal_code", "country", "phone")


# =============================================================================
# CATEGORY & TAG ADMIN
# =============================================================================

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Category admin"""
    list_display = ("name", "slug", "get_product_count", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)

    def get_product_count(self, obj):
        """Display number of products in category"""
        return obj.products.filter(approval_status="approved", is_active=True).count()
    
    get_product_count.short_description = "Products"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Tag admin"""
    list_display = ("name", "get_product_count", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

    def get_product_count(self, obj):
        """Display number of products with this tag"""
        return obj.products.filter(approval_status="approved", is_active=True).count()
    
    get_product_count.short_description = "Products"


# =============================================================================
# PRODUCT ADMIN
# =============================================================================

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Product admin with images inline"""
    inlines = [ProductImageInline]
    
    list_display = (
        "name",
        "get_image_preview",
        "price",
        "discount_price",
        "category",
        "count_in_stock",
        "approval_status",
        "is_active",
        "rating",
        "num_reviews",
        "created_at",
    )
    list_filter = (
        "approval_status",
        "is_active",
        "is_featured",
        "category",
        "created_at",
    )
    search_fields = ("name", "description", "brand", "user__email")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("rating", "num_reviews", "created_at", "updated_at")
    filter_horizontal = ("tags",)
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "slug", "user", "category", "brand", "description", "tags")
        }),
        ("Pricing & Inventory", {
            "fields": ("price", "discount_price", "count_in_stock")
        }),
        ("Media", {
            "fields": ("image",)
        }),
        ("Status & Approval", {
            "fields": ("approval_status", "is_active", "is_featured")
        }),
        ("Ratings & Reviews", {
            "fields": ("rating", "num_reviews"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def get_image_preview(self, obj):
        """Display thumbnail preview"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return "-"
    
    get_image_preview.short_description = "Image"


# =============================================================================
# REVIEW ADMIN
# =============================================================================

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Review admin"""
    list_display = ("product", "user", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("product__name", "user__email", "comment")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)


# =============================================================================
# ORDER ADMIN
# =============================================================================

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Order admin with items and shipping inline"""
    inlines = [OrderItemInline, ShippingAddressInline]
    
    list_display = (
        "id",
        "user",
        "get_order_total",
        "status",
        "is_paid",
        "is_delivered",
        "created_at",
    )
    list_filter = ("status", "is_paid", "is_delivered", "created_at")
    search_fields = ("id", "user__email", "user__first_name", "user__last_name")
    readonly_fields = (
        "user",
        "total_price",
        "shipping_price",
        "tax_price",
        "created_at",
        "updated_at",
        "paid_at",
        "delivered_at",
    )
    ordering = ("-created_at",)

    fieldsets = (
        ("Order Information", {
            "fields": ("id", "user", "status", "idempotency_key")
        }),
        ("Payment", {
            "fields": ("payment_method", "payment_id", "is_paid", "paid_at")
        }),
        ("Delivery", {
            "fields": ("is_delivered", "delivered_at", "tracking_number")
        }),
        ("Pricing", {
            "fields": ("tax_price", "shipping_price", "total_price")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def get_order_total(self, obj):
        """Display formatted order total"""
        return f"${obj.total_price}"
    
    get_order_total.short_description = "Total"
    get_order_total.admin_order_field = "total_price"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Order item admin"""
    list_display = ("order", "product", "name", "qty", "price", "get_total")
    list_filter = ("order__created_at",)
    search_fields = ("order__id", "name", "product__name")
    readonly_fields = ("order", "product", "get_total")

    def get_total(self, obj):
        """Display line item total"""
        return f"${obj.total_price}"
    
    get_total.short_description = "Line Total"


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    """Shipping address admin"""
    list_display = ("order", "address", "city", "country", "postal_code")
    search_fields = ("address", "city", "country", "order__id")
    readonly_fields = ("order",)


# =============================================================================
# CART & WISHLIST ADMIN
# =============================================================================

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """Cart item admin"""
    list_display = ("user", "product", "qty", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "product__name")
    ordering = ("-created_at",)


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    """Wishlist item admin"""
    list_display = ("user", "product", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "product__name")
    ordering = ("-created_at",)
