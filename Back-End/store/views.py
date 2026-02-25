"""
Store Views for Smart Shop E-commerce Platform
Complete refactored version with security, performance, and best practices

PAGINATION UPGRADE (v2):
- Replaced Django's manual Paginator/try-except blocks with proper DRF
  PageNumberPagination subclasses throughout.
- Four pagination classes cover every paginated endpoint:
    ProductPagination      (12/page) → get_products
    MyProductPagination    (20/page) → get_my_products
    OrderPagination        (10/page) → get_my_orders, get_seller_orders
    AdminOrderPagination   (20/page) → get_orders
- Each class overrides get_paginated_response() to return the exact JSON
  shape the frontend already expects:
    { "products|orders": [...], "page": N, "pages": N, "total": N }
- Removed: `from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger`
"""

import csv
import json
import logging
from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.db.models import Q, Sum, F, Avg, Count, Prefetch
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

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
from .serializers import (
    CategorySerializer,
    TagSerializer,
    ProductSerializer,
    SimpleProductSerializer,
    ReviewSerializer,
    OrderSerializer,
    CartItemSerializer,
    WishlistItemSerializer,
    StoreSettingsSerializer,
)

# Initialize logger
logger = logging.getLogger(__name__)


# =============================================================================
# DRF PAGINATION CLASSES
# All classes emit the same JSON envelope the frontend already consumes:
#   { "products|orders": [...], "page": N, "pages": N, "total": N }
# =============================================================================


class ProductPagination(PageNumberPagination):
    """12 products per page — used by the public product listing."""

    page_size = 12

    def get_paginated_response(self, data):
        return Response(
            {
                "products": data,
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "total": self.page.paginator.count,
            }
        )


class MyProductPagination(PageNumberPagination):
    """20 products per page — used by the seller's own product list."""

    page_size = 20

    def get_paginated_response(self, data):
        return Response(
            {
                "products": data,
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "total": self.page.paginator.count,
            }
        )


class OrderPagination(PageNumberPagination):
    """10 orders per page — used by customer (my orders) & seller order views."""

    page_size = 10

    def get_paginated_response(self, data):
        return Response(
            {
                "orders": data,
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "total": self.page.paginator.count,
            }
        )


class AdminOrderPagination(PageNumberPagination):
    """20 orders per page — used by the admin all-orders view."""

    page_size = 20

    def get_paginated_response(self, data):
        return Response(
            {
                "orders": data,
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "total": self.page.paginator.count,
            }
        )


# =============================================================================
# PRODUCT VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def get_products(request):
    """
    Get all products with filtering, search, and DRF pagination.
    Query params: keyword, category, stock_status, approval_status, page
    """
    query = request.query_params.get("keyword")
    category_slug = request.query_params.get("category")
    stock_status = request.query_params.get("stock_status")
    approval_status = request.query_params.get("approval_status")

    # Optimise query with select_related and prefetch_related
    products = Product.objects.select_related("category", "user").prefetch_related(
        "tags"
    )

    # Filter by approval status
    if not request.user.is_staff:
        products = products.filter(approval_status="approved", is_active=True)
    elif approval_status and approval_status != "all":
        products = products.filter(approval_status=approval_status)

    # Search filter
    if query:
        products = products.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(brand__icontains=query)
            | Q(category__name__icontains=query)
        )

    # Category filter
    if category_slug and category_slug != "all":
        # 2. الفلترة باستخدام slug الخاص بالقسم
        products = products.filter(category__slug=category_slug)

    # Stock filter
    if stock_status and stock_status != "all":
        if stock_status == "in-stock":
            products = products.filter(count_in_stock__gt=5)
        elif stock_status == "low-stock":
            products = products.filter(count_in_stock__gt=0, count_in_stock__lte=5)
        elif stock_status == "out-of-stock":
            products = products.filter(count_in_stock=0)

    products = products.order_by("-created_at")

    # ── DRF Pagination ──────────────────────────────────────────────────────
    paginator = ProductPagination()
    result_page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_product(request, slug): 
    """Get single product by ID or Slug with all related data"""
    queryset = (
        Product.objects.select_related("category", "user")
        .prefetch_related(
            Prefetch("reviews", queryset=Review.objects.select_related("user")),
            "images",
            "tags",
        )
    )
    
    # التعديل هنا: فحص هل المتغير رقم أم نص
    if slug.isdigit():
        # إذا كان رقماً، ابحث باستخدام الـ ID
        product = get_object_or_404(queryset, pk=slug)
    else:
        # إذا كان نصاً، ابحث باستخدام الـ slug
        product = get_object_or_404(queryset, slug=slug)

    # Only show non-approved products to admin or owner
    if product.approval_status != "approved" and not product.is_active:
        if not request.user.is_staff and (
            not request.user.is_authenticated or product.user != request.user
        ):
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_product(request):
    """
    Create a new product.
    Vendors create products in 'pending' status; admins can set status directly.
    """
    data = request.data
    user = request.user

    # Validate required fields
    required_fields = ["name", "price", "category", "count_in_stock"]
    missing_fields = [field for field in required_fields if not data.get(field)]

    if missing_fields:
        return Response(
            {"detail": f"Missing required fields: {', '.join(missing_fields)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate numeric fields
    try:
        price = Decimal(str(data.get("price")))
        if price <= 0:
            return Response(
                {"detail": "Price must be greater than 0."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        count_in_stock = int(data.get("count_in_stock"))
        if count_in_stock < 0:
            return Response(
                {"detail": "Stock count cannot be negative."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount_price = data.get("discount_price")
        if discount_price:
            discount_price = Decimal(str(discount_price))
            if discount_price < 0:
                return Response(
                    {"detail": "Discount price cannot be negative."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if discount_price >= price:
                return Response(
                    {"detail": "Discount price must be less than regular price."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    except (ValueError, TypeError) as e:
        return Response(
            {"detail": f"Invalid numeric value: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Set approval status
    approval_status = "pending"
    if user.is_staff:
        approval_status = data.get("approval_status", "approved")

    try:
        product = Product.objects.create(
            user=user,
            name=data.get("name"),
            price=price,
            discount_price=discount_price or None,
            brand=data.get("brand", ""),
            count_in_stock=count_in_stock,
            category_id=data.get("category"),
            description=data.get("description", ""),
            approval_status=approval_status,
            image=request.FILES.get("image"),
        )

        # Add product gallery images
        images = request.FILES.getlist("images")
        if images:
            ProductImage.objects.bulk_create(
                [ProductImage(product=product, image=img) for img in images]
            )

        # Add tags
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

            except json.JSONDecodeError as e:
                logger.warning(f"Error parsing tags for product {product.id}: {e}")

        serializer = ProductSerializer(product, many=False)
        logger.info(f"Product created: {product.id} by user {user.id}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return Response(
            {"detail": "Failed to create product. Please check your input."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product_review(request, pk):
    """Delete user's existing review for a product"""
    user = request.user
    product = get_object_or_404(Product, pk=pk)

    try:
        review = product.reviews.get(user=user)
        review.delete()

        stats = product.reviews.aggregate(
            avg_rating=Avg("rating"),
            count=Count("id"),
        )
        product.rating = stats["avg_rating"] or Decimal("0.00")
        product.num_reviews = stats["count"] or 0
        product.save()

        logger.info(f"Review deleted for product {product.id} by user {user.id}")
        return Response({"detail": "Review deleted successfully."})

    except Review.DoesNotExist:
        return Response(
            {"detail": "You have not reviewed this product yet."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_product(request, pk):
    """
    Update existing product.
    Only the product owner or an admin can update.
    """
    product = get_object_or_404(Product, pk=pk)
    data = request.data

    # Authorization check
    if product.user != request.user and not request.user.is_staff:
        return Response(
            {"detail": "You are not authorized to update this product."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Update basic fields
    product.name = data.get("name", product.name)
    product.brand = data.get("brand", product.brand)
    product.description = data.get("description", product.description)

    # Update numeric fields with validation
    try:
        if "price" in data:
            price = Decimal(str(data.get("price")))
            if price <= 0:
                return Response(
                    {"detail": "Price must be greater than 0."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            product.price = price

        if "discount_price" in data:
            discount_price = data.get("discount_price")
            if discount_price:
                discount_price = Decimal(str(discount_price))
                if discount_price < 0 or discount_price >= product.price:
                    return Response(
                        {
                            "detail": "Discount price must be less than regular price and non-negative."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                product.discount_price = discount_price
            else:
                product.discount_price = None

        if "count_in_stock" in data:
            count_in_stock = int(data.get("count_in_stock"))
            if count_in_stock < 0:
                return Response(
                    {"detail": "Stock count cannot be negative."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            product.count_in_stock = count_in_stock

    except (ValueError, TypeError) as e:
        return Response(
            {"detail": f"Invalid numeric value: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Only admin can change approval status
    if request.user.is_staff and "approval_status" in data:
        product.approval_status = data.get("approval_status")

    # Update category
    if data.get("category"):
        product.category_id = data.get("category")

    # Update main image
    if request.FILES.get("image"):
        product.image = request.FILES.get("image")

    # Add new gallery images
    images = request.FILES.getlist("images")
    if images:
        ProductImage.objects.bulk_create(
            [ProductImage(product=product, image=img) for img in images]
        )

    # Update tags
    if "tags" in data:
        tags_data = data["tags"]
        try:
            if isinstance(tags_data, str):
                tags_list = json.loads(tags_data)
            elif isinstance(tags_data, list):
                tags_list = tags_data
            else:
                tags_list = []

            product.tags.clear()
            for tag_name in tags_list:
                if tag_name.strip():
                    tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
                    product.tags.add(tag)

        except json.JSONDecodeError as e:
            logger.warning(f"Error parsing tags for product {product.id}: {e}")

    try:
        product.save()
        logger.info(f"Product updated: {product.id} by user {request.user.id}")
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error updating product {product.id}: {str(e)}")
        return Response(
            {"detail": "Failed to update product."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product(request, pk):
    """Delete product (only owner or admin)"""
    product = get_object_or_404(Product, pk=pk)

    if product.user != request.user and not request.user.is_staff:
        return Response(
            {"detail": "You are not authorized to delete this product."},
            status=status.HTTP_403_FORBIDDEN,
        )

    product_id = product.id
    product.delete()
    logger.info(f"Product deleted: {product_id} by user {request.user.id}")
    return Response({"detail": "Product deleted successfully."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product_image(request, pk):
    """Delete product gallery image (only owner or admin)"""
    image = get_object_or_404(ProductImage, pk=pk)

    if image.product.user != request.user and not request.user.is_staff:
        return Response(
            {"detail": "You are not authorized to delete this image."},
            status=status.HTTP_403_FORBIDDEN,
        )

    image.delete()
    logger.info(f"Product image deleted: {pk} by user {request.user.id}")
    return Response({"detail": "Image deleted successfully."})


# =============================================================================
# VENDOR VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_products(request):
    """
    Get all products created by the current user with DRF pagination.
    Returns 20 products per page.
    """
    user = request.user

    products = (
        Product.objects.filter(user=user)
        .select_related("category")
        .prefetch_related("tags")
        .order_by("-created_at")
    )

    # ── DRF Pagination ──────────────────────────────────────────────────────
    paginator = MyProductPagination()
    result_page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


# =============================================================================
# CATEGORY & TAG VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def get_categories(request):
    """Get all categories"""
    categories = Category.objects.all().order_by("name")
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_tags(request):
    """Get all tags"""
    tags = Tag.objects.all().order_by("name")
    serializer = TagSerializer(tags, many=True)
    return Response(serializer.data)


# ADMIN CATEGORY & TAG MANAGEMENT


@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_category(request):
    """Create new category (admin only)"""
    try:
        name = request.data.get("name", "").strip()
        if not name:
            return Response(
                {"detail": "Category name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Category.objects.filter(name__iexact=name).exists():
            return Response(
                {"detail": "Category with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = Category.objects.create(
            name=name,
            description=request.data.get("description", ""),
        )
        logger.info(f"Category created: {category.id}")
        return Response(
            CategorySerializer(category).data, status=status.HTTP_201_CREATED
        )

    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        return Response(
            {"detail": "Failed to create category."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_category(request, pk):
    """Update category (admin only)"""
    category = get_object_or_404(Category, pk=pk)

    name = request.data.get("name", category.name).strip()
    if not name:
        return Response(
            {"detail": "Category name cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category.name = name
    category.description = request.data.get("description", category.description)
    category.save()

    logger.info(f"Category updated: {category.id}")
    return Response(CategorySerializer(category).data)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_category(request, pk):
    """Delete category (admin only)"""
    category = get_object_or_404(Category, pk=pk)

    if category.products.exists():
        return Response(
            {"detail": "Cannot delete category with existing products."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category_id = category.id
    category.delete()
    logger.info(f"Category deleted: {category_id}")
    return Response({"detail": "Category deleted successfully."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_tag(request):
    """Create new tag (admin only)"""
    try:
        name = request.data.get("name", "").strip()
        if not name:
            return Response(
                {"detail": "Tag name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Tag.objects.filter(name__iexact=name).exists():
            return Response(
                {"detail": "Tag with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tag = Tag.objects.create(name=name)
        logger.info(f"Tag created: {tag.id}")
        return Response(TagSerializer(tag).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating tag: {str(e)}")
        return Response(
            {"detail": "Failed to create tag."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_tag(request, pk):
    """Update tag (admin only)"""
    tag = get_object_or_404(Tag, pk=pk)

    name = request.data.get("name", tag.name).strip()
    if not name:
        return Response(
            {"detail": "Tag name cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tag.name = name
    tag.save()

    logger.info(f"Tag updated: {tag.id}")
    return Response(TagSerializer(tag).data)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_tag(request, pk):
    """Delete tag (admin only)"""
    tag = get_object_or_404(Tag, pk=pk)
    tag_id = tag.id
    tag.delete()
    logger.info(f"Tag deleted: {tag_id}")
    return Response({"detail": "Tag deleted successfully."})


# =============================================================================
# ORDER VIEWS
# =============================================================================


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def add_order_items(request):
    """
    Create a new order with order items.
    Uses a database transaction to ensure data consistency.
    """
    user = request.user
    data = request.data
    order_items = data.get("order_items")

    if not order_items or len(order_items) == 0:
        return Response(
            {"detail": "No order items provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate decimal fields
    try:
        tax_price = Decimal(str(data.get("tax_price", "0.00")))
        shipping_price = Decimal(str(data.get("shipping_price", "0.00")))

        if tax_price < 0 or shipping_price < 0:
            return Response(
                {"detail": "Tax and shipping prices cannot be negative."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"detail": "Invalid price format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for idempotency key to prevent duplicate orders
    idempotency_key = data.get("idempotency_key")
    if idempotency_key:
        existing_order = Order.objects.filter(idempotency_key=idempotency_key).first()
        if existing_order:
            logger.warning(
                f"Duplicate order attempt with key: {idempotency_key} by user {user.id}"
            )
            return Response(
                {"id": existing_order.id, "detail": "Order already exists."},
                status=status.HTTP_200_OK,
            )

    # Validate shipping address
    shipping_address = data.get("shipping_address")
    if not shipping_address or not all(
        [
            shipping_address.get("address"),
            shipping_address.get("city"),
            shipping_address.get("country"),
        ]
    ):
        return Response(
            {"detail": "Complete shipping address is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # 1. Create order
        order = Order.objects.create(
            user=user,
            payment_method=data.get("payment_method", ""),
            tax_price=tax_price,
            shipping_price=shipping_price,
            total_price=Decimal("0.00"),  # calculated below
            idempotency_key=idempotency_key,
        )

        # 2. Create shipping address
        ShippingAddress.objects.create(
            order=order,
            address=shipping_address["address"],
            city=shipping_address["city"],
            postal_code=shipping_address.get("postal_code", ""),
            country=shipping_address["country"],
            phone=shipping_address.get("phone", ""),
        )

        # 3. Process order items and update product stock
        product_ids = [item["id"] for item in order_items]
        products = Product.objects.in_bulk(product_ids)

        total_items_price = Decimal("0.00")
        items_to_create = []

        for item_data in order_items:
            product = products.get(item_data["id"])
            if not product:
                logger.warning(f"Product {item_data['id']} not found in order creation")
                continue

            qty = int(item_data.get("qty", 1))
            if product.count_in_stock < qty:
                raise ValueError(
                    f"Product '{product.name}' only has {product.count_in_stock} units in stock."
                )

            final_price = product.final_price
            total_items_price += final_price * Decimal(str(qty))

            items_to_create.append(
                OrderItem(
                    product=product,
                    order=order,
                    name=product.name,
                    qty=qty,
                    price=final_price,
                    image=product.image.url if product.image else "",
                )
            )

            # Reduce stock using F() to prevent race conditions
            Product.objects.filter(pk=product.pk).update(
                count_in_stock=F("count_in_stock") - qty
            )

        OrderItem.objects.bulk_create(items_to_create)

        order.total_price = total_items_price + shipping_price + tax_price
        order.save()

        logger.info(
            f"Order created: {order.id} by user {user.id}, total: {order.total_price}"
        )
        return Response(
            {"id": order.id, "total": str(order.total_price)},
            status=status.HTTP_201_CREATED,
        )

    except ValueError as e:
        logger.error(f"Order creation failed for user {user.id}: {str(e)}")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in order creation: {str(e)}")
        return Response(
            {"detail": "Failed to create order. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_order_by_id(request, pk):
    """Get single order by ID (user's own order, seller's order, or admin)"""
    user = request.user

    try:
        order = (
            Order.objects.select_related("user", "shipping_address")
            .prefetch_related(
                Prefetch("items", queryset=OrderItem.objects.select_related("product"))
            )
            .get(id=pk)
        )

        is_seller_item = OrderItem.objects.filter(
            order=order, product__user=user
        ).exists()

        if user.is_staff or order.user == user or is_seller_item:
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "You are not authorized to view this order."},
                status=status.HTTP_403_FORBIDDEN,
            )

    except Order.DoesNotExist:
        return Response(
            {"detail": "Order not found."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_orders(request):
    """
    Get all orders for the current customer with DRF pagination.
    Returns 10 orders per page.
    """
    user = request.user

    orders = (
        Order.objects.filter(user=user)
        .select_related("shipping_address")
        .prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product"))
        )
        .order_by("-created_at")
    )

    # ── DRF Pagination ──────────────────────────────────────────────────────
    paginator = OrderPagination()
    result_page = paginator.paginate_queryset(orders, request)
    serializer = OrderSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_order_to_paid(request, pk):
    """Mark order as paid (should integrate with a payment gateway)"""
    order = get_object_or_404(Order, pk=pk)

    if order.user != request.user and not request.user.is_staff:
        return Response(
            {"detail": "You are not authorized to update this order."},
            status=status.HTTP_403_FORBIDDEN,
        )

    order.is_paid = True
    order.paid_at = timezone.now()
    order.payment_id = request.data.get("payment_id", "")
    order.save()

    logger.info(f"Order {order.id} marked as paid")
    return Response({"detail": "Order marked as paid."})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_orders(request):
    """
    Get all orders (admin only) with DRF pagination.
    Returns 20 orders per page.
    """
    orders = (
        Order.objects.select_related("user", "shipping_address")
        .prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product"))
        )
        .order_by("-created_at")
    )

    # ── DRF Pagination ──────────────────────────────────────────────────────
    paginator = AdminOrderPagination()
    result_page = paginator.paginate_queryset(orders, request)
    serializer = OrderSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_order_to_delivered(request, pk):
    """Mark order as delivered (admin only)"""
    order = get_object_or_404(Order, pk=pk)

    order.is_delivered = True
    order.delivered_at = timezone.now()
    order.status = "Delivered"
    order.tracking_number = request.data.get("tracking_number", "")
    order.save()

    logger.info(f"Order {order.id} marked as delivered")
    return Response({"detail": "Order marked as delivered."})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_order(request, pk):
    """Delete order (admin only)"""
    order = get_object_or_404(Order, pk=pk)
    order_id = order.id
    order.delete()

    logger.info(f"Order {order_id} deleted by admin")
    return Response({"detail": "Order deleted successfully."})


# =============================================================================
# REVIEW VIEWS
# =============================================================================


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product_review(request, pk):
    """Create a review for a product (one review per user per product)"""
    user = request.user
    product = get_object_or_404(Product, id=pk)
    data = request.data

    if product.reviews.filter(user=user).exists():
        return Response(
            {"detail": "You have already reviewed this product."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rating = data.get("rating", 0)
    try:
        rating = int(rating)
        if not 1 <= rating <= 5:
            return Response(
                {"detail": "Rating must be between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"detail": "Invalid rating value."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    Review.objects.create(
        user=user,
        product=product,
        rating=rating,
        comment=data.get("comment", ""),
    )

    stats = product.reviews.aggregate(avg_rating=Avg("rating"), count=Count("id"))
    product.rating = stats["avg_rating"] or Decimal("0.00")
    product.num_reviews = stats["count"] or 0
    product.save()

    logger.info(f"Review created for product {product.id} by user {user.id}")
    return Response(
        {"detail": "Review added successfully."}, status=status.HTTP_201_CREATED
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_product_review(request, pk):
    """Update user's existing review for a product"""
    user = request.user
    product = get_object_or_404(Product, pk=pk)
    data = request.data

    try:
        review = product.reviews.get(user=user)
    except Review.DoesNotExist:
        return Response(
            {"detail": "You have not reviewed this product yet."},
            status=status.HTTP_404_NOT_FOUND,
        )

    rating = data.get("rating")
    if rating is not None:
        try:
            rating = int(rating)
            if not 1 <= rating <= 5:
                return Response(
                    {"detail": "Rating must be between 1 and 5."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            review.rating = rating
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid rating value."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if "comment" in data:
        review.comment = data["comment"]

    review.save()

    stats = product.reviews.aggregate(avg_rating=Avg("rating"), count=Count("id"))
    product.rating = stats["avg_rating"] or Decimal("0.00")
    product.num_reviews = stats["count"] or 0
    product.save()

    logger.info(f"Review updated for product {product.id} by user {user.id}")
    return Response({"detail": "Review updated successfully."})


# =============================================================================
# CART VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    """Get current user's cart items"""
    user = request.user
    cart_items = (
        CartItem.objects.select_related("product")
        .filter(user=user)
        .order_by("-created_at")
    )
    serializer = CartItemSerializer(cart_items, many=True)

    total = sum(
        item.product.final_price * Decimal(str(item.qty))
        for item in cart_items
        if item.product
    )

    return Response(
        {
            "cart_items": serializer.data,
            "total": str(total),
            "count": cart_items.count(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add product to cart or update quantity if it already exists"""
    user = request.user
    data = request.data
    product_id = data.get("product_id")

    if not product_id:
        return Response(
            {"detail": "Product ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        qty = int(data.get("qty", 1))
        if qty < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"detail": "Invalid quantity value."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    product = get_object_or_404(Product, id=product_id)

    cart_item, created = CartItem.objects.get_or_create(user=user, product=product)
    new_qty = qty if created else cart_item.qty + qty

    if new_qty > product.count_in_stock:
        return Response(
            {"detail": f"Only {product.count_in_stock} units available in stock."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_item.qty = new_qty
    cart_item.save()

    logger.info(
        f"Product {product.id} added to cart for user {user.id}, qty: {new_qty}"
    )
    return Response({"detail": "Item added to cart.", "qty": new_qty})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_cart_item(request):
    """Update cart item quantity"""
    user = request.user
    data = request.data
    product_id = data.get("product_id")

    if not product_id:
        return Response(
            {"detail": "Product ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        qty = int(data.get("qty"))
        if qty < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"detail": "Invalid quantity value."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    product = get_object_or_404(Product, id=product_id)
    cart_item = get_object_or_404(CartItem, user=user, product=product)

    if qty > product.count_in_stock:
        return Response(
            {"detail": f"Only {product.count_in_stock} units available in stock."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_item.qty = qty
    cart_item.save()

    logger.info(
        f"Cart item updated for user {user.id}, product {product.id}, qty: {qty}"
    )
    return Response({"detail": "Cart item updated.", "qty": qty})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, pk):
    """Remove item from cart"""
    cart_item = get_object_or_404(CartItem, user=request.user, product__id=pk)
    cart_item.delete()

    logger.info(f"Product {pk} removed from cart for user {request.user.id}")
    return Response({"detail": "Item removed from cart."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Clear all items from cart"""
    deleted_count, _ = CartItem.objects.filter(user=request.user).delete()

    logger.info(
        f"Cart cleared for user {request.user.id}, {deleted_count} items removed"
    )
    return Response({"detail": f"Cart cleared. {deleted_count} items removed."})


# =============================================================================
# WISHLIST VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    """Get current user's wishlist"""
    user = request.user
    wishlist = (
        WishlistItem.objects.select_related("product")
        .filter(user=user)
        .order_by("-created_at")
    )
    serializer = WishlistItemSerializer(wishlist, many=True)

    return Response(
        {
            "wishlist_items": serializer.data,
            "count": wishlist.count(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request):
    """Add or remove product from wishlist (toggle)"""
    user = request.user
    product_id = request.data.get("product_id")

    if not product_id:
        return Response(
            {"detail": "Product ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    product = get_object_or_404(Product, id=product_id)
    item = WishlistItem.objects.filter(user=user, product=product)

    if item.exists():
        item.delete()
        logger.info(f"Product {product.id} removed from wishlist for user {user.id}")
        return Response({"status": "removed", "detail": "Removed from wishlist."})
    else:
        WishlistItem.objects.create(user=user, product=product)
        logger.info(f"Product {product.id} added to wishlist for user {user.id}")
        return Response({"status": "added", "detail": "Added to wishlist."})


# =============================================================================
# ADDITIONAL PRODUCT VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def get_top_products(request):
    """Get top-rated products (approved only)"""
    products = (
        Product.objects.filter(
            rating__gte=4,
            approval_status="approved",
            is_active=True,
        )
        .select_related("category")
        .order_by("-rating")[:5]
    )
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_products_by_category(request):
    """
    Get products grouped by category.
    Optimised with prefetch_related to avoid N+1 queries.
    """
    categories = Category.objects.prefetch_related(
        Prefetch(
            "products",
            queryset=Product.objects.filter(
                approval_status="approved",
                is_active=True,
            )
            .select_related("user")
            .prefetch_related("tags")
            .order_by("-created_at"),
        )
    ).all()

    data = []
    for cat in categories:
        products = cat.products.all()
        if products:
            serializer = ProductSerializer(products, many=True)
            data.append(
                {
                    "id": cat.id,
                    "name": cat.name,
                    "slug": cat.slug,
                    "products": serializer.data,
                }
            )

    return Response(data)


# =============================================================================
# SELLER ORDERS — store app (migrated from users app)
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_seller_orders(request):
    """
    Get all orders that contain at least one product belonging to the
    current authenticated seller/vendor, with DRF pagination (10/page).

    Route: GET /api/orders/seller-orders/
    """
    user = request.user

    orders = (
        Order.objects.filter(items__product__user=user)
        .select_related("user", "shipping_address")
        .prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product"))
        )
        .distinct()
        .order_by("-created_at")
    )

    # ── DRF Pagination ──────────────────────────────────────────────────────
    paginator = OrderPagination()
    result_page = paginator.paginate_queryset(orders, request)
    serializer = OrderSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


# =============================================================================
# ADMIN DASHBOARD & STATS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    total_sales = Order.objects.aggregate(sum=Sum("total_price"))["sum"] or Decimal(
        "0.00"
    )
    total_orders = Order.objects.count()
    total_products = Product.objects.count()
    total_users = User.objects.count()

    recent_orders = Order.objects.select_related("user").order_by("-created_at")[:10]

    orders_data = [
        {
            "date": o.created_at.strftime("%d/%m"),
            "sales": str(o.total_price),
            "order_id": o.id,
        }
        for o in reversed(recent_orders)
    ]

    return Response(
        {
            "total_sales": str(total_sales),
            "total_orders": total_orders,
            "total_products": total_products,
            "total_users": total_users,
            "sales_chart": orders_data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def export_orders_csv(request):
    """Export all orders to CSV (admin only)"""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="orders_report.csv"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "Order ID",
            "Customer",
            "Email",
            "Date",
            "Total Price",
            "Paid",
            "Delivered",
            "Status",
        ]
    )

    orders = Order.objects.select_related("user").order_by("-created_at")

    for order in orders:
        writer.writerow(
            [
                order.id,
                (
                    f"{order.user.first_name} {order.user.last_name}".strip()
                    if order.user
                    else "Guest"
                ),
                order.user.email if order.user else "",
                order.created_at.strftime("%Y-%m-%d %H:%M"),
                str(order.total_price),
                "Yes" if order.is_paid else "No",
                "Yes" if order.is_delivered else "No",
                order.status,
            ]
        )

    logger.info(f"Orders CSV exported by admin user {request.user.id}")
    return response


# =============================================================================
# STORE SETTINGS VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def get_store_settings(request):
    """
    Return current store-wide settings (tax_rate, shipping_cost,
    free_shipping_threshold).

    Public endpoint — no auth required so the frontend can use these
    values on the cart/checkout pages for unauthenticated users too.
    The table row is created with safe defaults on first access.
    """
    settings_obj = StoreSettings.get_settings()
    serializer = StoreSettingsSerializer(settings_obj)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_store_settings(request):
    """
    Update global store settings. Admin-only.

    Accepts partial payloads (partial=True) so the admin can update
    a single field without sending all fields.

    Request body (all optional):
        {
            "tax_rate": "0.1000",
            "shipping_cost": "75.00",
            "free_shipping_threshold": "5000.00"
        }

    Returns the full updated settings object.
    """
    settings_obj = StoreSettings.get_settings()
    serializer = StoreSettingsSerializer(settings_obj, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        logger.info(
            "Store settings updated by admin user %s: %s",
            request.user.id,
            serializer.data,
        )
        return Response(serializer.data)

    logger.warning(
        "Store settings update failed for admin user %s: %s",
        request.user.id,
        serializer.errors,
    )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
