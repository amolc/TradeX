from rest_framework import serializers
from products.models import Product
from users.models import User
from .models import Conversation, Message, Order


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]


class ProductNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "quantity"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserNestedSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "message_type",
            "content",
            "offer_unit_price",
            "offer_quantity",
            "offer_delivery_days",
            "is_accepted",
            "created_at",
        ]


class MessageCreateSerializer(serializers.Serializer):
    conversation_id = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.all(),
        source="conversation",
        write_only=True,
    )
    message_text = serializers.CharField(write_only=True)
    offer_unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    offer_quantity = serializers.IntegerField(required=False, allow_null=True)
    offer_delivery_days = serializers.IntegerField(required=False, allow_null=True)

    def validate_message_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message text cannot be empty.")
        return value

    def validate_offer_quantity(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Offer quantity must be greater than zero.")
        return value

    def validate_offer_delivery_days(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "Offer delivery days must be greater than zero."
            )
        return value


class AcceptOfferSerializer(serializers.Serializer):
    message_id = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(),
        source="message",
        write_only=True,
    )


class ConversationSerializer(serializers.ModelSerializer):
    buyer = UserNestedSerializer(read_only=True)
    supplier = UserNestedSerializer(read_only=True)
    product = ProductNestedSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "buyer",
            "supplier",
            "product",
            "inquiry_text",
            "status",
            "created_at",
            "updated_at",
            "messages",
        ]


class ConversationCreateSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
    )
    inquiry_text = serializers.CharField()

    def validate_inquiry_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Inquiry text cannot be empty.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    product = ProductNestedSerializer(read_only=True)
    conversation_id = serializers.IntegerField(source="conversation.id", read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "product",
            "conversation_id",
            "product_id",
            "quantity",
            "order_type",
            "status",
            "shipping_mode",
            "supplier_response",
            "unit_price",
            "total_amount",
            "order_date",
        ]
        read_only_fields = [
            "status",
            "supplier_response",
            "unit_price",
            "total_amount",
        ]
