from rest_framework import viewsets
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Buyer sees only their orders
        if user.role == 'buyer':
            return Order.objects.filter(user=user)

        # Supplier can see all orders (for now)
        return Order.objects.all()

    def perform_create(self, serializer):
        user = self.request.user

        # 🚫 Only buyers can place orders
        if user.role != 'buyer':
            raise PermissionDenied("Only buyers can place orders")

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        # 🚨 Stock validation
        if product.quantity < quantity:
            raise ValidationError("Not enough stock available!")

        # ✅ Reduce stock
        product.quantity -= quantity
        product.save()

        # ✅ Save order
        order = serializer.save(user=user)

        # 🚀 AUTO CREATE LOGISTICS
        from logistics.models import Logistics

        Logistics.objects.create(
            order=order,
            status="Pending",
            current_location="Warehouse"
        )