from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import User
from users.services import get_marketplace_profile
from .models import Logistics, LogisticsInquiry
from .serializers import LogisticsInquirySerializer, LogisticsSerializer


def is_admin_user(user):
    return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))


class LogisticsViewSet(viewsets.ModelViewSet):
    serializer_class = LogisticsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = get_marketplace_profile(user)

        if is_admin_user(user):
            return Logistics.objects.all().select_related("order", "order__user", "order__product")

        if profile and profile.role == "buyer":
            return Logistics.objects.filter(order__user=profile).select_related("order", "order__product")

        if profile and profile.role == "supplier":
            return Logistics.objects.filter(order__product__supplier=user).select_related("order", "order__user", "order__product")

        return Logistics.objects.none()

    def perform_create(self, serializer):
        raise PermissionDenied("Logistics records are created automatically from orders")

    def perform_update(self, serializer):
        profile = get_marketplace_profile(self.request.user)
        order = serializer.instance.order

        if is_admin_user(self.request.user):
            serializer.save()
            return

        if not profile or profile.role != "supplier":
            raise PermissionDenied("Only suppliers or admins can update shipment tracking")

        if order.product.supplier_id != self.request.user.id:
            raise PermissionDenied("You can only update logistics for your own orders")

        serializer.save()

    def perform_destroy(self, instance):
        raise PermissionDenied("Logistics records cannot be deleted from the API")


class LogisticsInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = LogisticsInquirySerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        profile = get_marketplace_profile(user)

        if is_admin_user(user):
            return LogisticsInquiry.objects.all().order_by("-created_at")

        if profile and profile.role == "buyer":
            return LogisticsInquiry.objects.filter(email__iexact=profile.email).order_by(
                "-created_at"
            )

        if profile and profile.role == "supplier":
            return LogisticsInquiry.objects.all().order_by("-created_at")

        return LogisticsInquiry.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        profile = get_marketplace_profile(self.request.user)

        if profile is None and not getattr(self.request.user, "is_authenticated", False):
            profile = User.objects.filter(role="buyer").first()

        serializer.save(buyer=profile if profile and profile.role == "buyer" else None)
