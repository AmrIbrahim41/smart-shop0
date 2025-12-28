from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator 

# ----------------- Category -----------------
class Category(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True) # SEO
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# ----------------- Product -----------------
class Product(models.Model):
    APPROVAL_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    tags = models.ManyToManyField(Tag, blank=True)
    
    name = models.CharField(max_length=200, db_index=True) 
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    brand = models.CharField(max_length=200, null=True, blank=True) 
    description = models.TextField(null=True, blank=True) 
    
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], db_index=True) 
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    count_in_stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])    
    
    image = models.ImageField(upload_to='products/', null=True, blank=True) 
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    num_reviews = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False, db_index=True) 
    
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending') 
    
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_gallery/')

    def __str__(self):
        return f"Image for {self.product.name}"

# ----------------- Reviews -----------------
class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews') 
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) 
    rating = models.IntegerField(default=0, validators=[MinValueValidator(1), MaxValueValidator(5)]) 
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return str(self.rating)

# ----------------- Orders -----------------
class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders')
    payment_method = models.CharField(max_length=200, null=True, blank=True)
    
    tax_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    is_delivered = models.BooleanField(default=False) 
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True) 
    
    name = models.CharField(max_length=200, null=True, blank=True) 
    qty = models.IntegerField(default=1) 
    price = models.DecimalField(max_digits=10, decimal_places=2) 
    image = models.CharField(max_length=200, null=True, blank=True) 
    
    def __str__(self):
        return str(self.name)

class ShippingAddress(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipping_address', primary_key=True) 
    address = models.CharField(max_length=200)
    city = models.CharField(max_length=200)
    postal_code = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=200)
    
    def __str__(self):
        return str(self.address)

# ----------------- Cart & Wishlist -----------------
class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.qty} x {self.product.name}"

class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return self.product.name