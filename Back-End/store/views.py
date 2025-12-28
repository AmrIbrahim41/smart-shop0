from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny  
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Sum, F
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import csv
from django.http import HttpResponse
import json
from datetime import datetime

from .models import *
from .serializers import *

# ----------------- Products Views -----------------

@api_view(["GET"])
@permission_classes([AllowAny])
def get_products(request):
    """ get all products"""
    query = request.query_params.get("keyword")
    category_id = request.query_params.get("category")

    # get catageory with product
    products = Product.objects.select_related('category', 'user').order_by("-created_at")

    if query:
        products = products.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(brand__icontains=query)
            | Q(category__name__icontains=query)
        )

    if category_id:
        products = products.filter(category__id=category_id)

    # get approved products only 
    if not request.user.is_staff:
        products = products.filter(approval_status="approved")

    # Pagination
    page = request.query_params.get("page", 1)
    paginator = Paginator(products, 8)

    try:
        products = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        products = paginator.page(1) 
    serializer = ProductSerializer(products, many=True)
    return Response(
        {"products": serializer.data, "page": int(page), "pages": paginator.num_pages}
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_product(request, pk):
    queryset = Product.objects.select_related('category', 'user').prefetch_related('reviews', 'images', 'tags')
    product = get_object_or_404(queryset, pk=pk)
    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_product(request):
    data = request.data
    user = request.user

    approval_status = "pending"
    if user.is_staff:
        approval_status = data.get("approval_status", "pending")

    try:
        product = Product.objects.create(
            user=user,
            name=data.get("name"),
            price=data.get("price"),
            discount_price=data.get("discount_price", 0),
            brand=data.get("brand"),
            count_in_stock=data.get("countInStock"), 
            category_id=data.get("category"),
            description=data.get("description"),
            approval_status=approval_status,
            image=request.FILES.get("image")
        )

        images = request.FILES.getlist("images")
        if images:
            ProductImage.objects.bulk_create([
                ProductImage(product=product, image=img) for img in images
            ])

        if "tags" in data:
            tags_data = data["tags"]
            tags_list = []

            try:
                if isinstance(tags_data, str):
                    tags_list = json.loads(tags_data) 
                elif isinstance(tags_data, list):
                    tags_list = tags_data 
                
                for tag_name in tags_list:
                    if tag_name.strip():
                        tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
                        product.tags.add(tag)
                        
            except Exception as e:
                print(f"Error saving tags: {e}") 

        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)

    except Exception as e:
         return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    data = request.data

    # check if its related seller or admin 
    if product.user != request.user and not request.user.is_staff:
        return Response({"detail": "Not authorized"}, status=status.HTTP_401_UNAUTHORIZED)

    product.name = data.get("name", product.name)
    product.price = data.get("price", product.price)
    product.discount_price = data.get("discount_price", product.discount_price)
    product.brand = data.get("brand", product.brand)
    product.count_in_stock = data.get("countInStock", product.count_in_stock)
    product.description = data.get("description", product.description)
    
    if request.user.is_staff:
        product.approval_status = data.get("approval_status", product.approval_status)

    if data.get("category"):
        product.category_id = data.get("category")

    if request.FILES.get("image"):
        product.image = request.FILES.get("image")

    # add new imgs 
    images = request.FILES.getlist("images")
    if images:
        ProductImage.objects.bulk_create([
            ProductImage(product=product, image=img) for img in images
        ])

    # update tags 
    if "tags" in data:
        tags_data = data["tags"]
        if isinstance(tags_data, str):
            try:
                tags_list = json.loads(tags_data)
                product.tags.clear()
                for tag_name in tags_list:
                    tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
                    product.tags.add(tag)
            except json.JSONDecodeError:
                alert("tags have an error")

    product.save()
    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if product.user != request.user and not request.user.is_staff:
        return Response({"detail": "Not authorized"}, status=status.HTTP_401_UNAUTHORIZED)
    
    product.delete()
    return Response("Product Deleted")

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product_image(request, pk):
    image = get_object_or_404(ProductImage, pk=pk)
    if image.product.user != request.user and not request.user.is_staff:
        return Response({"detail": "Not authorized"}, status=status.HTTP_401_UNAUTHORIZED)
    image.delete()
    return Response("Image Deleted")


# ----------------- Vendors -----------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_products(request):
    user = request.user
    products = Product.objects.filter(user=user).order_by('-created_at')
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


# ----------------- Categories & Tags -----------------
@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


# ----------------- Orders Views (Optimized) -----------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic  # to git the order right only 
def add_order_items(request):
    user = request.user
    data = request.data
    order_items = data.get("orderItems")

    if not order_items or len(order_items) == 0:
        return Response({"detail": "No Order Items"}, status=status.HTTP_400_BAD_REQUEST)

    # 1. create order 
    order = Order.objects.create(
        user=user,
        payment_method=data["paymentMethod"],
        tax_price=Decimal(data["taxPrice"]),
        shipping_price=Decimal(data["shippingPrice"]),
        total_price=Decimal(0.0) 
    )

    # 2. shiping address
    ShippingAddress.objects.create(
        order=order,
        address=data["shippingAddress"]["address"],
        city=data["shippingAddress"]["city"],
        postal_code=data["shippingAddress"]["postalCode"],
        country=data["shippingAddress"]["country"],
    )

    # 3. upadte products quant and order
    product_ids = [item['id'] for item in order_items]
    products = Product.objects.in_bulk(product_ids) 

    total_items_price = Decimal(0)
    items_to_create = []

    for item_data in order_items:
        product = products.get(item_data['id'])
        if not product:
            continue # to avoid wrong products 

        # Check product stock
        if product.count_in_stock < item_data['qty']:
             raise Exception(f"Product {product.name} is out of stock")

        final_price = product.discount_price if (product.discount_price and product.discount_price > 0) else product.price
        
        # clac price * quant 
        total_items_price += final_price * Decimal(item_data['qty'])

        # 
        items_to_create.append(OrderItem(
            product=product,
            order=order,
            name=product.name,
            qty=item_data['qty'],
            price=final_price,
            image=product.image.url if product.image else ""
        ))

        product.count_in_stock = F('count_in_stock') - item_data['qty']
        product.save(update_fields=['count_in_stock'])

    OrderItem.objects.bulk_create(items_to_create)

    order.total_price = total_items_price + Decimal(data["shippingPrice"]) + Decimal(data["taxPrice"])
    order.save()

    return Response({"id": order.id}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_order_by_id(request, pk):
    user = request.user
    try:
        order = Order.objects.select_related('user', 'shipping_address').get(id=pk)

        # make sure the seller is the same seller of the product
        is_seller_item = OrderItem.objects.filter(order=order, product__user=user).exists()

        if user.is_staff or order.user == user or is_seller_item:
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data)
        else:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_orders(request):
    user = request.user
    orders = Order.objects.filter(user=user).order_by("-created_at")
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)



# ----------------- Reviews -----------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product_review(request, pk):
    user = request.user
    product = get_object_or_404(Product, id=pk)
    data = request.data

    if product.reviews.filter(user=user).exists():
        return Response({"detail": "Product already reviewed"}, status=status.HTTP_400_BAD_REQUEST)

    rating = data.get("rating", 0)
    if rating == 0:
        return Response({"detail": "Please select a rating"}, status=status.HTTP_400_BAD_REQUEST)

    # create Review
    Review.objects.create(
        user=user,
        product=product,
        rating=rating,
        comment=data.get("comment", "")
    )

    #  create the  avg stars 
    from django.db.models import Avg
    stats = product.reviews.aggregate(avg_rating=Avg('rating'), count=models.Count('id'))
    
    product.rating = stats['avg_rating'] or 0
    product.num_reviews = stats['count'] or 0
    product.save()

    return Response("Review Added")


# ----------------- Cart & Wishlist -----------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    user = request.user
    cart_items = CartItem.objects.select_related('product').filter(user=user).order_by("-created_at")
    serializer = CartItemSerializer(cart_items, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    user = request.user
    data = request.data
    product_id = data.get("product_id")
    qty = int(data.get("qty", 1))

    product = get_object_or_404(Product, id=product_id)

    cart_item, created = CartItem.objects.get_or_create(user=user, product=product)
    
    cart_item.qty = qty if created else (cart_item.qty + qty) 
    cart_item.save()

    return Response("Item Added to Cart")

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    user = request.user
    wishlist = WishlistItem.objects.select_related('product').filter(user=user).order_by("-created_at")
    serializer = WishlistItemSerializer(wishlist, many=True)
    return Response(serializer.data)



# ----------------- Orders Management (Admin & Status) -----------------

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_order_to_paid(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.is_paid = True
    order.paid_at = datetime.now()
    order.save()
    return Response("Order was paid")

@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_orders(request):
    orders = Order.objects.select_related('user').all().order_by("-created_at")
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_order_to_delivered(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.is_delivered = True
    order.delivered_at = datetime.now()
    order.save()
    return Response("Order was delivered")

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_order(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.delete()
    return Response("Order was deleted")


# ----------------- Additional Product Views -----------------

@api_view(["GET"])
@permission_classes([AllowAny])
def get_top_products(request):
    # أعلى 5 منتجات تقييماً
    products = Product.objects.filter(rating__gte=4).order_by("-rating")[0:5]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def get_products_by_category(request):
    categories = Category.objects.all()
    data = []
    for cat in categories:
        products = Product.objects.filter(category=cat, approval_status="approved").order_by("-created_at") 
        if products.exists():
            serializer = ProductSerializer(products, many=True)
            data.append({"id": cat.id, "name": cat.name, "products": serializer.data})
    return Response(data)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_product_review(request, pk):
    user = request.user
    product = get_object_or_404(Product, pk=pk)
    data = request.data

    review = get_object_or_404(product.reviews, user=user)

    if data.get("rating") == 0:
        return Response({"detail": "Please select a rating"}, status=status.HTTP_400_BAD_REQUEST)

    review.rating = int(data["rating"])
    review.comment = data["comment"]
    review.save()

    from django.db.models import Avg, Count
    stats = product.reviews.aggregate(avg_rating=Avg('rating'), count=Count('id'))
    
    product.rating = stats['avg_rating'] or 0
    product.save()

    return Response("Review Updated")


# ----------------- Cart & Wishlist Actions -----------------

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, pk):
    cart_item = get_object_or_404(CartItem, user=request.user, product__id=pk)
    cart_item.delete()
    return Response("Item Removed")

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    CartItem.objects.filter(user=request.user).delete()
    return Response("Cart Cleared")

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request):
    user = request.user
    product_id = request.data.get("product_id")
    product = get_object_or_404(Product, id=product_id)

    item = WishlistItem.objects.filter(user=user, product=product)

    if item.exists():
        item.delete()
        return Response({"status": "removed"})
    else:
        WishlistItem.objects.create(user=user, product=product)
        return Response({"status": "added"})


# ----------------- Admin Dashboard & Stats -----------------

@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_dashboard_stats(request):
    total_sales = Order.objects.aggregate(sum=Sum("total_price"))["sum"] or 0
    total_orders = Order.objects.count()
    total_products = Product.objects.count()
    total_users = User.objects.count()

    recent_orders = Order.objects.all().order_by("-created_at")[:10]
    orders_data = [
        {"name": o.created_at.strftime("%d/%m"), "sales": o.total_price}
        for o in reversed(recent_orders)
    ]

    return Response({
        "totalSales": total_sales,
        "totalOrders": total_orders,
        "totalProducts": total_products,
        "totalUsers": total_users,
        "salesChart": orders_data,
    })

@api_view(["GET"])
@permission_classes([IsAdminUser])
def export_orders_csv(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="orders_report.csv"'

    writer = csv.writer(response)
    writer.writerow(["Order ID", "Customer", "Date", "Total Price", "Paid?", "Delivered?"])

    orders = Order.objects.all().order_by("-created_at")
    for order in orders:
        writer.writerow([
            order.id,
            order.user.first_name if order.user else "Guest",
            order.created_at.strftime("%Y-%m-%d"),
            order.total_price,
            "Yes" if order.is_paid else "No",
            "Yes" if order.is_delivered else "No",
        ])

    return response


# ----------------- Admin Category & Tag Management -----------------

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_category(request):
    try:
        category = Category.objects.create(name=request.data["name"])
        return Response(CategorySerializer(category, many=False).data)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_category(request, pk):
    category = get_object_or_404(Category, pk=pk)
    category.name = request.data.get("name", category.name)
    category.save()
    return Response(CategorySerializer(category, many=False).data)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_category(request, pk):
    category = get_object_or_404(Category, pk=pk)
    category.delete()
    return Response("Category Deleted")

@api_view(["GET"])
def get_tags(request):
    tags = Tag.objects.all()
    serializer = CategorySerializer(tags, many=True) 
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_tag(request):
    try:
        tag = Tag.objects.create(name=request.data["name"])
        return Response(CategorySerializer(tag).data)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_tag(request, pk):
    tag = get_object_or_404(Tag, pk=pk)
    tag.name = request.data.get("name", tag.name)
    tag.save()
    return Response(CategorySerializer(tag).data)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_tag(request, pk):
    tag = get_object_or_404(Tag, pk=pk)
    tag.delete()
    return Response("Tag Deleted")





@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_cart_item(request):
   
    user = request.user
    data = request.data
    product_id = data.get("product_id")
    qty = int(data.get("qty"))

    if qty < 1:
        return Response({"detail": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)

    product = get_object_or_404(Product, id=product_id)
    cart_item = get_object_or_404(CartItem, user=user, product=product)
    
    cart_item.qty = qty
    cart_item.save()
    
    return Response("Cart Item Updated")



