from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Supplier sees only their products
        if user.role == 'supplier':
            return Product.objects.filter(supplier=user)

        # Buyer sees all products
        return Product.objects.all()

    def perform_create(self, serializer):
        # Only supplier can create product
        if self.request.user.role != 'supplier':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only suppliers can create products")

        serializer.save(supplier=self.request.user)