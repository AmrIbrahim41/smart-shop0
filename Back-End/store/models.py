"""
Store Models for Smart Shop E-commerce Platform
Includes: Categories, Tags, Products, Reviews, Orders, Cart, Wishlist
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal


# =============================================================================
# CATEGORY & TAGS
# =============================================================================

class Category(models.Model):
    """Product categories for organizing the store"""
    name = models.CharField(max_length=200, unique=True, db_index=True)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Product tags for filtering and searching"""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# =============================================================================
# PRODUCT MODELS
# =============================================================================

class Product(models.Model):
    """Main product model with approval workflow"""
    
    APPROVAL_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    # Relationships
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name="products"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")

    # Basic Information
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    brand = models.CharField(max_length=200, null=True, blank=True, db_index=True)
    description = models.TextField(null=True, blank=True)

    # Pricing (with validation)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        db_index=True,
        help_text="Regular price in USD"
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Discounted price (must be less than regular price)"
    )

    # Inventory
    count_in_stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        db_index=True
    )

    # Images
    image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
        help_text="Main product image"
    )

    # Ratings & Reviews
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("5.00"))
        ]
    )
    num_reviews = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # Product Status
    is_featured = models.BooleanField(default=False, db_index=True)
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_CHOICES,
        default="pending",
        db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["approval_status", "is_active"]),
            models.Index(fields=["category", "approval_status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["-rating"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def clean(self):
        """Validate discount price is less than regular price"""
        super().clean()
        if self.discount_price is not None and self.discount_price > Decimal("0"):
            if self.discount_price >= self.price:
                raise ValidationError({
                    "discount_price": "Discount price must be less than regular price."
                })

    def save(self, *args, **kwargs):
        """Override save to run full_clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def final_price(self):
        """Get the actual selling price (discount or regular)"""
        if self.discount_price and self.discount_price > Decimal("0"):
            return self.discount_price
        return self.price

    @property
    def is_in_stock(self):
        """Check if product is available"""
        return self.count_in_stock > 0


class ProductImage(models.Model):
    """Additional product images for gallery"""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="product_gallery/")
    alt_text = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Image for {self.product.name}"


# =============================================================================
# REVIEW MODELS
# =============================================================================

class Review(models.Model):
    """Product reviews and ratings from customers"""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviews"
    )
    rating = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username if self.user else 'Anonymous'} - {self.rating} stars"


# =============================================================================
# ORDER MODELS
# =============================================================================

class Order(models.Model):
    """Customer orders"""
    
    STATUS_CHOICES = (
        ("Pending", "Pending"),
        ("Processing", "Processing"),
        ("Shipped", "Shipped"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    )

    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="orders"
    )

    # Payment Information
    payment_method = models.CharField(max_length=200, null=True, blank=True)
    payment_id = models.CharField(max_length=200, null=True, blank=True)

    # Pricing
    tax_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    shipping_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    # Status & Tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending",
        db_index=True
    )
    tracking_number = models.CharField(max_length=200, null=True, blank=True)

    # Payment Status
    is_paid = models.BooleanField(default=False, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Delivery Status
    is_delivered = models.BooleanField(default=False, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Idempotency key for preventing duplicate orders
    idempotency_key = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        unique=True,
        db_index=True
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["is_paid", "is_delivered"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    """Individual items within an order"""
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name="order_items"
    )

    # Snapshot of product data at time of order
    name = models.CharField(max_length=200, null=True, blank=True)
    qty = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    image = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.qty}x {self.name}"

    @property
    def total_price(self):
        """Calculate line item total"""
        return self.price * Decimal(str(self.qty))


class ShippingAddress(models.Model):
    """Shipping address for orders"""
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="shipping_address",
        primary_key=True
    )
    address = models.CharField(max_length=200)
    city = models.CharField(max_length=200)
    postal_code = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Shipping Addresses"

    def __str__(self):
        return f"{self.address}, {self.city}, {self.country}"


# =============================================================================
# CART & WISHLIST MODELS
# =============================================================================

class CartItem(models.Model):
    """Shopping cart items for logged-in users"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    qty = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def clean(self):
        """Validate quantity doesn't exceed stock"""
        super().clean()
        if self.product and self.qty > self.product.count_in_stock:
            raise ValidationError({
                "qty": f"Only {self.product.count_in_stock} items available in stock."
            })

    def __str__(self):
        return f"{self.qty}x {self.product.name} (Cart of {self.user.username})"


class WishlistItem(models.Model):
    """Wishlist items for logged-in users"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.product.name} (Wishlist of {self.user.username})"
