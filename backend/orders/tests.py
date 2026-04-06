from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from logistics.models import Logistics
from products.models import Product
from users.models import User
from .models import Conversation, Message, Order


AuthUser = get_user_model()


class OrderFlowTests(APITestCase):
    def setUp(self):
        self.supplier_auth = AuthUser.objects.create_user(
            username="supplier@example.com",
            email="supplier@example.com",
            password="testpass123",
        )
        self.buyer_auth = AuthUser.objects.create_user(
            username="buyer@example.com",
            email="buyer@example.com",
            password="testpass123",
        )
        self.supplier_profile = User.objects.create(
            name="Supplier",
            email="supplier@example.com",
            role="supplier",
        )
        self.buyer_profile = User.objects.create(
            name="Buyer",
            email="buyer@example.com",
            role="buyer",
        )
        self.product = Product.objects.create(
            name="Copper Wire",
            price=125.50,
            quantity=20,
            supplier=self.supplier_auth,
        )

    def test_buyer_can_create_order_with_shipping_and_logistics(self):
        self.client.force_authenticate(user=self.buyer_auth)

        response = self.client.post(
            reverse("orders-list"),
            {
                "product_id": self.product.id,
                "quantity": 3,
                "order_type": Order.TYPE_ORDER,
                "shipping_mode": Order.SHIPPING_AIR,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get()
        logistics = Logistics.objects.get(order=order)

        self.product.refresh_from_db()
        self.assertEqual(order.user, self.buyer_profile)
        self.assertEqual(order.status, Order.STATUS_PENDING)
        self.assertEqual(order.shipping_mode, Order.SHIPPING_AIR)
        self.assertEqual(logistics.tracking_stage, Logistics.STAGE_SUPPLIER)
        self.assertEqual(logistics.shipping_mode, Logistics.SHIPPING_AIR)
        self.assertEqual(self.product.quantity, 17)

    def test_supplier_can_confirm_order(self):
        order = Order.objects.create(
            user=self.buyer_profile,
            product=self.product,
            quantity=2,
            order_type=Order.TYPE_ORDER,
            shipping_mode=Order.SHIPPING_SEA,
            unit_price=125.50,
            total_amount=251.00,
        )

        self.client.force_authenticate(user=self.supplier_auth)
        response = self.client.post(
            reverse("orders-supplier-action", args=[order.id]),
            {"action": "confirm", "message": "Confirmed for dispatch."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.STATUS_CONFIRMED)
        self.assertEqual(order.supplier_response, "Confirmed for dispatch.")


class ConversationFlowTests(APITestCase):
    def setUp(self):
        self.supplier_auth = AuthUser.objects.create_user(
            username="supplier-chat@example.com",
            email="supplier-chat@example.com",
            password="testpass123",
        )
        self.buyer_auth = AuthUser.objects.create_user(
            username="buyer-chat@example.com",
            email="buyer-chat@example.com",
            password="testpass123",
        )
        self.supplier_profile = User.objects.create(
            name="Supplier Chat",
            email="supplier-chat@example.com",
            role="supplier",
        )
        self.buyer_profile = User.objects.create(
            name="Buyer Chat",
            email="buyer-chat@example.com",
            role="buyer",
        )
        self.product = Product.objects.create(
            name="Industrial Pump",
            price=450.00,
            quantity=15,
            supplier=self.supplier_auth,
        )

    def test_buyer_can_create_conversation_with_initial_message(self):
        self.client.force_authenticate(user=self.buyer_auth)

        response = self.client.post(
            reverse("conversations-list"),
            {
                "product_id": self.product.id,
                "inquiry_text": "Need 10 units with delivery timeline.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        conversation = Conversation.objects.get()
        message = Message.objects.get()

        self.assertEqual(conversation.buyer, self.buyer_profile)
        self.assertEqual(conversation.supplier, self.supplier_profile)
        self.assertEqual(conversation.product, self.product)
        self.assertEqual(conversation.inquiry_text, "Need 10 units with delivery timeline.")
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.sender, self.buyer_profile)
        self.assertEqual(message.content, "Need 10 units with delivery timeline.")

    def test_supplier_cannot_create_conversation(self):
        self.client.force_authenticate(user=self.supplier_auth)

        response = self.client.post(
            reverse("conversations-list"),
            {
                "product_id": self.product.id,
                "inquiry_text": "Need pricing details.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
