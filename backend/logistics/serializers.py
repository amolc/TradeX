from rest_framework import serializers
from .models import Logistics, LogisticsInquiry, LogisticsInquiryMessage

class LogisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Logistics
        fields = '__all__'


class LogisticsInquiryMessageSerializer(serializers.ModelSerializer):
    sender_role_display = serializers.CharField(
        source="get_sender_role_display",
        read_only=True,
    )

    class Meta:
        model = LogisticsInquiryMessage
        fields = [
            "id",
            "sender_role",
            "sender_role_display",
            "sender_name",
            "sender_email",
            "message",
            "created_at",
        ]
        read_only_fields = fields


class LogisticsInquirySerializer(serializers.ModelSerializer):
    service_type_display = serializers.CharField(
        source="get_service_type_display",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    messages = LogisticsInquiryMessageSerializer(many=True, read_only=True)

    class Meta:
        model = LogisticsInquiry
        fields = [
            "id",
            "buyer",
            "name",
            "email",
            "service_type",
            "service_type_display",
            "cargo_type",
            "origin",
            "destination",
            "quantity",
            "weight",
            "notes",
            "status",
            "status_display",
            "telegram_username",
            "created_at",
            "messages",
        ]
        read_only_fields = [
            "id",
            "buyer",
            "created_at",
            "service_type_display",
            "status_display",
            "messages",
        ]


class LogisticsInquiryReplySerializer(serializers.Serializer):
    message = serializers.CharField()
    status = serializers.ChoiceField(
        choices=LogisticsInquiry.STATUS_CHOICES,
        required=False,
    )

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message cannot be empty.")
        return value
