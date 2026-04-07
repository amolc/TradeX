from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Product


AuthUser = get_user_model()


class ProductOwnershipTests(APITestCase):
    def setUp(self):
        self.supplier_auth = AuthUser.objects.create_user(
            username="supplier-products@example.com",
            email="supplier-products@example.com",
            password="testpass123",
        )
        self.other_supplier_auth = AuthUser.objects.create_user(
            username="other-products@example.com",
            email="other-products@example.com",
            password="testpass123",
        )
        User.objects.create(
            name="Supplier Products",
            email="supplier-products@example.com",
            role="supplier",
        )
        User.objects.create(
            name="Other Supplier Products",
            email="other-products@example.com",
            role="supplier",
        )
        self.owned_product = Product.objects.create(
            name="Owned Product",
            price=10,
            quantity=5,
            supplier=self.supplier_auth,
        )
        self.other_product = Product.objects.create(
            name="Other Product",
            price=15,
            quantity=8,
            supplier=self.other_supplier_auth,
        )

    def test_supplier_only_sees_own_products(self):
        self.client.force_authenticate(user=self.supplier_auth)

        response = self.client.get(reverse("products-list"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.owned_product.id)

    def test_supplier_cannot_update_other_supplier_product(self):
        self.client.force_authenticate(user=self.supplier_auth)

        response = self.client.patch(
            reverse("products-detail", args=[self.other_product.id]),
            {"price": 99},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_supplier_cannot_delete_other_supplier_product(self):
        self.client.force_authenticate(user=self.supplier_auth)

        response = self.client.delete(
            reverse("products-detail", args=[self.other_product.id]),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
