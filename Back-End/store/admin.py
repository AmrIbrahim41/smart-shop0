from django.contrib import admin
from .models import *

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]
    list_display = ('name', 'price', 'category', 'count_in_stock', 'created_at')
    list_filter = ('category', 'created_at') 
    search_fields = ('name', 'description') 

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ['product', 'name', 'qty', 'price'] 
    can_delete = False
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'is_paid', 'is_delivered', 'created_at')
    list_filter = ('is_paid', 'is_delivered', 'created_at')
    search_fields = ('user__username', 'user__email', 'id')
    inlines = [OrderItemInline] 
    readonly_fields = ['user', 'total_price', 'shipping_price'] 

admin.site.register(Product, ProductAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Review)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(CartItem)
admin.site.register(WishlistItem)