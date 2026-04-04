from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .models import Order
from .serializers import OrderSerializer
from rest_framework.permissions import IsAuthenticated

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        # 🚨 Validation
        if product.quantity < quantity:
            raise ValidationError("Not enough stock available!")

        # ✅ Reduce stock
        product.quantity -= quantity
        product.save()

        # ✅ Save order
        serializer.save()