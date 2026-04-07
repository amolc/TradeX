from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Product
from .serializers import ProductSerializer
from users.services import get_marketplace_profile


def is_admin_user(user):
    return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        auth_user = self.request.user
        profile = get_marketplace_profile(auth_user)

        if is_admin_user(auth_user):
            return Product.objects.all().select_related('supplier')

        if profile and profile.role == 'supplier':
            return Product.objects.filter(supplier=auth_user).select_related('supplier')

        return Product.objects.all().select_related('supplier')

    def perform_create(self, serializer):
        profile = get_marketplace_profile(self.request.user)

        if not profile or profile.role != 'supplier':
            raise PermissionDenied("Only suppliers can create products")

        serializer.save(supplier=self.request.user)

    def perform_update(self, serializer):
        profile = get_marketplace_profile(self.request.user)
        product = self.get_object()

        if is_admin_user(self.request.user):
            serializer.save()
            return

        if not profile or profile.role != 'supplier':
            raise PermissionDenied("Only suppliers or admins can update products")

        if product.supplier_id != self.request.user.id:
            raise PermissionDenied("You can only update your own products")

        serializer.save()

    def perform_destroy(self, instance):
        profile = get_marketplace_profile(self.request.user)

        if is_admin_user(self.request.user):
            instance.delete()
            return

        if not profile or profile.role != 'supplier':
            raise PermissionDenied("Only suppliers or admins can delete products")

        if instance.supplier_id != self.request.user.id:
            raise PermissionDenied("You can only delete your own products")

        instance.delete()
