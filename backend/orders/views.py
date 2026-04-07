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
    AcceptOfferSerializer,
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    OrderSerializer,
)


def is_admin_user(user):
    return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = get_marketplace_profile(user)
        queryset = Conversation.objects.select_related(
            "buyer", "supplier", "product"
        ).prefetch_related("messages")

        if is_admin_user(user):
            return queryset

        if not profile:
            return queryset.none()

        if profile.role == "buyer":
            return queryset.filter(buyer=profile)

        if profile.role == "supplier":
            return queryset.filter(supplier=profile)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationSerializer

    @transaction.atomic
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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

        inquiry_text = serializer.validated_data["inquiry_text"]
        conversation = Conversation.objects.filter(
            buyer=profile,
            supplier=supplier_profile,
            product=product,
        ).first()

        if conversation is None:
            conversation = Conversation.objects.create(
                buyer=profile,
                supplier=supplier_profile,
                product=product,
                inquiry_text=inquiry_text,
            )
        else:
            conversation.inquiry_text = inquiry_text
            conversation.save(update_fields=["inquiry_text", "updated_at"])

        Message.objects.create(
            conversation=conversation,
            sender=profile,
            message_type=Message.TYPE_TEXT,
            content=inquiry_text,
        )
        return Response(
            {"conversation_id": conversation.id},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        conversation = self.get_object()
        profile = get_marketplace_profile(request.user)
        admin_user = is_admin_user(request.user)

        if not profile and not admin_user:
            raise PermissionDenied("Authenticated marketplace profile is required")

        if not admin_user and profile.id not in {conversation.buyer_id, conversation.supplier_id}:
            raise PermissionDenied("Only conversation participants can access messages")

        if request.method.lower() == "get":
            queryset = conversation.messages.select_related("sender").order_by("created_at")
            output = MessageSerializer(queryset, many=True, context={"request": request})
            return Response(output.data, status=status.HTTP_200_OK)

        if admin_user:
            raise PermissionDenied("Admin can monitor conversations but cannot send messages")

        payload = request.data.copy()
        payload["conversation_id"] = conversation.id
        serializer = MessageCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        offer_unit_price = serializer.validated_data.get("offer_unit_price")
        offer_quantity = serializer.validated_data.get("offer_quantity")
        offer_delivery_days = serializer.validated_data.get("offer_delivery_days")

        has_offer_fields = any(
            value is not None
            for value in (offer_unit_price, offer_quantity, offer_delivery_days)
        )
        explicit_message_type = str(request.data.get("message_type", "")).strip().lower()

        message = Message.objects.create(
            conversation=conversation,
            sender=profile,
            message_type=(
                Message.TYPE_OFFER
                if explicit_message_type == Message.TYPE_OFFER or has_offer_fields
                else Message.TYPE_TEXT
            ),
            content=serializer.validated_data["message_text"],
            offer_unit_price=offer_unit_price,
            offer_quantity=offer_quantity,
            offer_delivery_days=offer_delivery_days,
        )

        output = MessageSerializer(message, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = get_marketplace_profile(request.user)

        if not profile:
            raise PermissionDenied("Authenticated marketplace profile is required")

        conversation = serializer.validated_data["conversation"]
        if profile.id not in {conversation.buyer_id, conversation.supplier_id}:
            raise PermissionDenied("Only conversation participants can send messages")

        offer_unit_price = serializer.validated_data.get("offer_unit_price")
        offer_quantity = serializer.validated_data.get("offer_quantity")
        offer_delivery_days = serializer.validated_data.get("offer_delivery_days")

        has_offer_fields = any(
            value is not None
            for value in (offer_unit_price, offer_quantity, offer_delivery_days)
        )

        message = Message.objects.create(
            conversation=conversation,
            sender=profile,
            message_type=Message.TYPE_OFFER if has_offer_fields else Message.TYPE_TEXT,
            content=serializer.validated_data["message_text"],
            offer_unit_price=offer_unit_price,
            offer_quantity=offer_quantity,
            offer_delivery_days=offer_delivery_days,
        )

        output = MessageSerializer(message, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="accept-offer")
    def accept_offer(self, request, *args, **kwargs):
        serializer = AcceptOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = get_marketplace_profile(request.user)

        if not profile:
            raise PermissionDenied("Authenticated marketplace profile is required")

        message = serializer.validated_data["message"]
        conversation = message.conversation

        if message.message_type != Message.TYPE_OFFER:
            raise ValidationError({"message_id": "Only offer messages can be accepted."})

        if profile.id != conversation.buyer_id:
            raise PermissionDenied("Only the buyer can accept this offer")

        if message.is_accepted:
            raise ValidationError({"message_id": "This offer has already been accepted."})

        if message.offer_unit_price is None or message.offer_quantity is None:
            raise ValidationError(
                {"message_id": "Offer price and quantity are required to create an order."}
            )

        total_amount = message.offer_unit_price * message.offer_quantity

        message.is_accepted = True
        message.save(update_fields=["is_accepted"])

        order = Order.objects.create(
            user=conversation.buyer,
            product=conversation.product,
            conversation=conversation,
            accepted_offer_message=message,
            quantity=message.offer_quantity,
            order_type=Order.TYPE_ORDER,
            status=Order.STATUS_PENDING,
            unit_price=message.offer_unit_price,
            total_amount=total_amount,
        )

        output = OrderSerializer(order, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)
        queryset = Order.objects.select_related("user", "product")

        if is_admin_user(auth_user):
            return queryset

        if profile and profile.role == "buyer":
            return queryset.filter(user=profile)

        if profile and profile.role == "supplier":
            return queryset.filter(product__supplier=auth_user)

        return queryset.none()

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

        conversation = None
        if order_type == Order.TYPE_ENQUIRY:
            supplier_profile = User.objects.filter(
                email__iexact=product.supplier.email,
                role="supplier",
            ).first()

            if not supplier_profile:
                raise ValidationError(
                    {"product_id": "Supplier profile not found for this product."}
                )

            conversation = Conversation.objects.filter(
                buyer=profile,
                supplier=supplier_profile,
                product=product,
            ).first()

            inquiry_text = f"Need {quantity} units"
            if conversation is None:
                conversation = Conversation.objects.create(
                    buyer=profile,
                    supplier=supplier_profile,
                    product=product,
                    inquiry_text=inquiry_text,
                )
            else:
                conversation.inquiry_text = inquiry_text
                conversation.save(update_fields=["inquiry_text", "updated_at"])

            Message.objects.create(
                conversation=conversation,
                sender=profile,
                message_type=Message.TYPE_TEXT,
                content=inquiry_text,
            )

        unit_price = Decimal(str(product.price))
        total_amount = unit_price * quantity

        if order_type == Order.TYPE_ORDER:
            product.quantity -= quantity
            product.save(update_fields=["quantity"])

        order = serializer.save(
            user=profile,
            conversation=conversation,
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

    def perform_update(self, serializer):
        if not is_admin_user(self.request.user):
            raise PermissionDenied("Only admins can edit order records directly")

        serializer.save()

    def perform_destroy(self, instance):
        raise PermissionDenied("Orders cannot be deleted from the API")

    @action(detail=True, methods=["post"])
    def supplier_action(self, request, pk=None):
        profile = get_marketplace_profile(request.user)
        order = self.get_object()
        user = request.user

        if not profile or profile.role != "supplier":
            raise PermissionDenied("Only suppliers can respond to enquiries or confirm orders")

        if order.product.supplier_id != user.id:
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

    @action(detail=True, methods=["post"], url_path="admin-update")
    def admin_update(self, request, pk=None):
        if not is_admin_user(request.user):
            raise PermissionDenied("Only admins can update order workflow")

        order = self.get_object()
        status_value = str(request.data.get("status", "")).strip().lower()
        response_message = str(request.data.get("supplier_response", "")).strip()
        shipping_mode = str(request.data.get("shipping_mode", "")).strip().lower()
        updated_fields = []

        valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
        valid_shipping_modes = {choice[0] for choice in Order.SHIPPING_CHOICES}

        if status_value:
            if status_value not in valid_statuses:
                raise ValidationError({"status": "Invalid order status."})
            order.status = status_value
            updated_fields.append("status")

        if response_message:
            order.supplier_response = response_message
            updated_fields.append("supplier_response")

        if shipping_mode:
            if shipping_mode not in valid_shipping_modes:
                raise ValidationError({"shipping_mode": "Invalid shipping mode."})
            order.shipping_mode = shipping_mode
            updated_fields.append("shipping_mode")

        if not updated_fields:
            raise ValidationError("Provide at least one field to update.")

        order.save(update_fields=updated_fields)
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
                "scope": "admin" if is_admin_user(request.user) else profile.role if profile else "all",
                "total_requests": totals["total_requests"] or 0,
                "total_value": totals["total_value"] or 0,
                "status_counts": status_counts,
                "type_counts": type_counts,
                "shipment_stages": shipment_stages,
            }
        )
