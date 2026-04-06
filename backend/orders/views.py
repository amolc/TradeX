from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from logistics.models import Logistics
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny   # 👈 CHANGED HERE
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


class ConversationViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]   # 👈 CHANGED HERE

    def get_queryset(self):
        # TEMPORARY TESTING ONLY
        return Conversation.objects.all().select_related(
            "buyer", "supplier", "product"
        ).prefetch_related(
            "messages",
        )

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

        if getattr(request.user, "is_authenticated", False):
            profile = get_marketplace_profile(request.user)
        else:
            # TEMPORARY TESTING LOGIC: allow local API testing without auth setup.
            profile = User.objects.filter(role="buyer").first()

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

        if getattr(request.user, "is_authenticated", False):
            profile = get_marketplace_profile(request.user)
        else:
            profile = (
                User.objects.filter(pk=conversation.buyer_id).first()
                or User.objects.filter(role="buyer").first()
            )

        if not profile:
            raise PermissionDenied("Authenticated marketplace profile is required")

        if profile.id not in {conversation.buyer_id, conversation.supplier_id}:
            raise PermissionDenied("Only conversation participants can access messages")

        if request.method.lower() == "get":
            queryset = conversation.messages.select_related("sender").order_by("created_at")
            output = MessageSerializer(queryset, many=True, context={"request": request})
            return Response(output.data, status=status.HTTP_200_OK)

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
    permission_classes = [AllowAny]   # 👈 CHANGED HERE
    serializer_class = MessageSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if getattr(request.user, "is_authenticated", False):
            profile = get_marketplace_profile(request.user)
        else:
            # TEMPORARY TESTING LOGIC: allow local API testing without auth setup.
            profile = User.objects.filter(role="buyer").first()

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

        if getattr(request.user, "is_authenticated", False):
            profile = get_marketplace_profile(request.user)
        else:
            # TEMPORARY TESTING LOGIC: allow local API testing without auth setup.
            profile = User.objects.filter(role="buyer").first()

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
    # TEMPORARY TESTING ONLY
    authentication_classes = []
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]   # 👈 OPTIONAL (you can keep IsAuthenticated if you want)

    def get_queryset(self):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)

        if profile and profile.role == "buyer":
            return Order.objects.filter(user=profile).select_related("user", "product")

        if profile and profile.role == "supplier":
            return Order.objects.filter(product__supplier=auth_user).select_related("user", "product")

        return Order.objects.all().select_related("user", "product")

    def perform_create(self, serializer):
        if getattr(self.request.user, "is_authenticated", False):
            auth_user = self.request.user
            profile = get_marketplace_profile(auth_user)
        else:
            # TEMPORARY TESTING ONLY
            auth_user = None
            profile = User.objects.filter(role="buyer").first()

        if not profile or profile.role != "buyer":
            raise PermissionDenied("Only buyers can create enquiries or orders")

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]
        order_type = serializer.validated_data.get("order_type", Order.TYPE_ORDER)
        shipping_mode = serializer.validated_data.get("shipping_mode", "")

        if auth_user and product.supplier_id == auth_user.id:
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

    @action(detail=True, methods=["post"])
    def supplier_action(self, request, pk=None):
        profile = get_marketplace_profile(request.user)
        order = self.get_object()

        if getattr(request.user, "is_authenticated", False):
            user = request.user
        else:
            # TEMPORARY TESTING ONLY
            user = order.product.supplier

        # TEMPORARY TESTING ONLY
        if False:
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
