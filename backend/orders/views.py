from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from logistics.models import Logistics
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from users.services import get_marketplace_profile
from .models import Conversation, Message, Order
from .serializers import (
    ConversationCreateSerializer,
    ConversationSerializer,
    OrderSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = get_marketplace_profile(self.request.user)

        if not profile:
            return Conversation.objects.none()

        return Conversation.objects.filter(
            buyer=profile
        ).select_related("buyer", "supplier", "product").prefetch_related(
            "messages",
            "messages__sender",
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = get_marketplace_profile(request.user)
        if not profile or profile.role != "buyer":
            raise PermissionDenied("Only buyers can create inquiries")

        product = serializer.validated_data["product"]
        supplier_profile = User.objects.filter(
            email__iexact=product.supplier.email,
            role="supplier",
        ).first()

        if not supplier_profile:
            raise ValidationError(
                {"product_id": "Supplier profile not found for this product."}
            )

        if supplier_profile.id == profile.id:
            raise ValidationError("You cannot start an inquiry for your own product")

        conversation = Conversation.objects.create(
            buyer=profile,
            supplier=supplier_profile,
            product=product,
            inquiry_text=serializer.validated_data["inquiry_text"],
        )
        Message.objects.create(
            conversation=conversation,
            sender=profile,
            message_type=Message.TYPE_TEXT,
            content=serializer.validated_data["inquiry_text"],
        )

        output = ConversationSerializer(conversation, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)

        if profile and profile.role == "buyer":
            return Order.objects.filter(user=profile).select_related("user", "product")

        if profile and profile.role == "supplier":
            return Order.objects.filter(product__supplier=auth_user).select_related("user", "product")

        return Order.objects.all().select_related("user", "product")

    def perform_create(self, serializer):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)

        if not profile or profile.role != "buyer":
            raise PermissionDenied("Only buyers can create enquiries or orders")

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]
        order_type = serializer.validated_data.get("order_type", Order.TYPE_ORDER)
        shipping_mode = serializer.validated_data.get("shipping_mode", "")

        if product.supplier_id == auth_user.id:
            raise ValidationError("You cannot create a request for your own product")

        if quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")

        if order_type == Order.TYPE_ORDER and product.quantity < quantity:
            raise ValidationError("Not enough stock available!")

        if order_type == Order.TYPE_ORDER and shipping_mode not in {
            Order.SHIPPING_AIR,
            Order.SHIPPING_SEA,
        }:
            raise ValidationError("Shipping mode must be selected for orders")

        unit_price = Decimal(str(product.price))
        total_amount = unit_price * quantity

        if order_type == Order.TYPE_ORDER:
            product.quantity -= quantity
            product.save(update_fields=["quantity"])

        order = serializer.save(
            user=profile,
            status=Order.STATUS_PENDING,
            unit_price=unit_price,
            total_amount=total_amount,
        )

        Logistics.objects.create(
            order=order,
            status=Logistics.STATUS_PENDING,
            tracking_stage=Logistics.STAGE_SUPPLIER,
            shipping_mode=shipping_mode,
            location="Supplier",
        )

    @action(detail=True, methods=["post"])
    def supplier_action(self, request, pk=None):
        profile = get_marketplace_profile(request.user)
        order = self.get_object()

        if not profile or profile.role != "supplier":
            raise PermissionDenied("Only suppliers can respond to enquiries or confirm orders")

        if order.product.supplier_id != request.user.id:
            raise PermissionDenied("You can only manage requests for your own products")

        action_type = str(request.data.get("action", "")).strip().lower()
        response_message = str(request.data.get("message", "")).strip()

        if action_type not in {"confirm", "respond"}:
            raise ValidationError({"action": "Use 'confirm' for orders or 'respond' for enquiries."})

        if action_type == "confirm":
            if order.order_type != Order.TYPE_ORDER:
                raise ValidationError("Only orders can be confirmed")
            order.status = Order.STATUS_CONFIRMED
        else:
            order.status = Order.STATUS_RESPONDED

        if response_message:
            order.supplier_response = response_message

        order.save(update_fields=["status", "supplier_response"])
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        profile = get_marketplace_profile(request.user)
        queryset = self.get_queryset()
        logistics_queryset = Logistics.objects.filter(order__in=queryset)

        totals = queryset.aggregate(
            total_requests=Count("id"),
            total_value=Sum("total_amount"),
        )

        status_counts = {
            item["status"]: item["count"]
            for item in queryset.values("status").annotate(count=Count("id"))
        }
        type_counts = {
            item["order_type"]: item["count"]
            for item in queryset.values("order_type").annotate(count=Count("id"))
        }
        shipment_stages = {
            item["tracking_stage"]: item["count"]
            for item in logistics_queryset.values("tracking_stage").annotate(count=Count("id"))
        }

        return Response(
            {
                "scope": profile.role if profile else "all",
                "total_requests": totals["total_requests"] or 0,
                "total_value": totals["total_value"] or 0,
                "status_counts": status_counts,
                "type_counts": type_counts,
                "shipment_stages": shipment_stages,
            }
        )

    def perform_update(self, serializer):
        raise PermissionDenied("Use the dedicated supplier action endpoint to manage request status")

    def perform_destroy(self, instance):
        raise PermissionDenied("Orders cannot be deleted from the API")
