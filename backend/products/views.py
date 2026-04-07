from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Product
from .serializers import ProductSerializer
from users.services import get_marketplace_profile


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)

        if profile and profile.role == 'supplier':
            return Product.objects.filter(supplier=auth_user).select_related('supplier')

        return Product.objects.all().select_related('supplier')

    def perform_create(self, serializer):
        profile = get_marketplace_profile(self.request.user)

        if not profile or profile.role != 'supplier':
            raise PermissionDenied("Only suppliers can create products")

        serializer.save(supplier=self.request.user)
