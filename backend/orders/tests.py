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

    def test_conversation_participant_can_send_message(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )

        self.client.force_authenticate(user=self.supplier_auth)
        response = self.client.post(
            reverse("messages-list"),
            {
                "conversation_id": conversation.id,
                "message_text": "We can supply 10 units next week.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get()
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.sender, self.supplier_profile)
        self.assertEqual(message.message_type, Message.TYPE_TEXT)
        self.assertEqual(message.content, "We can supply 10 units next week.")

    def test_non_participant_cannot_send_message(self):
        outsider_auth = AuthUser.objects.create_user(
            username="outsider@example.com",
            email="outsider@example.com",
            password="testpass123",
        )
        User.objects.create(
            name="Outsider",
            email="outsider@example.com",
            role="buyer",
        )
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )

        self.client.force_authenticate(user=outsider_auth)
        response = self.client.post(
            reverse("messages-list"),
            {
                "conversation_id": conversation.id,
                "message_text": "I should not be able to post here.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_message_text_cannot_be_empty(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )

        self.client.force_authenticate(user=self.buyer_auth)
        response = self.client.post(
            reverse("messages-list"),
            {
                "conversation_id": conversation.id,
                "message_text": "   ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_participant_can_get_messages_in_created_order(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        first_message = Message.objects.create(
            conversation=conversation,
            sender=self.buyer_profile,
            message_type=Message.TYPE_TEXT,
            content="First message",
        )
        second_message = Message.objects.create(
            conversation=conversation,
            sender=self.supplier_profile,
            message_type=Message.TYPE_TEXT,
            content="Second message",
        )

        self.client.force_authenticate(user=self.buyer_auth)
        response = self.client.get(
            reverse("messages-list"),
            {"conversation_id": conversation.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], first_message.id)
        self.assertEqual(response.data[0]["content"], "First message")
        self.assertEqual(response.data[1]["id"], second_message.id)
        self.assertEqual(response.data[1]["content"], "Second message")

    def test_non_participant_cannot_get_messages(self):
        outsider_auth = AuthUser.objects.create_user(
            username="viewer@example.com",
            email="viewer@example.com",
            password="testpass123",
        )
        User.objects.create(
            name="Viewer",
            email="viewer@example.com",
            role="buyer",
        )
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        Message.objects.create(
            conversation=conversation,
            sender=self.buyer_profile,
            message_type=Message.TYPE_TEXT,
            content="Visible only to participants",
        )

        self.client.force_authenticate(user=outsider_auth)
        response = self.client.get(
            reverse("messages-list"),
            {"conversation_id": conversation.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_buyer_can_accept_offer_and_create_order(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        offer_message = Message.objects.create(
            conversation=conversation,
            sender=self.supplier_profile,
            message_type=Message.TYPE_OFFER,
            content="Offer for 5 units",
            offer_unit_price=400.00,
            offer_quantity=5,
            offer_delivery_days=7,
        )

        self.client.force_authenticate(user=self.buyer_auth)
        response = self.client.post(
            reverse("messages-accept-offer"),
            {"message_id": offer_message.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        offer_message.refresh_from_db()
        order = Order.objects.get(accepted_offer_message=offer_message)

        self.assertTrue(offer_message.is_accepted)
        self.assertEqual(order.user, self.buyer_profile)
        self.assertEqual(order.product, self.product)
        self.assertEqual(order.conversation, conversation)
        self.assertEqual(order.quantity, 5)
        self.assertEqual(float(order.unit_price), 400.00)
        self.assertEqual(float(order.total_amount), 2000.00)

    def test_supplier_cannot_accept_offer(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        offer_message = Message.objects.create(
            conversation=conversation,
            sender=self.supplier_profile,
            message_type=Message.TYPE_OFFER,
            content="Offer for 5 units",
            offer_unit_price=400.00,
            offer_quantity=5,
        )

        self.client.force_authenticate(user=self.supplier_auth)
        response = self.client.post(
            reverse("messages-accept-offer"),
            {"message_id": offer_message.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_offer_message_cannot_be_accepted(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        text_message = Message.objects.create(
            conversation=conversation,
            sender=self.supplier_profile,
            message_type=Message.TYPE_TEXT,
            content="Regular message",
        )

        self.client.force_authenticate(user=self.buyer_auth)
        response = self.client.post(
            reverse("messages-accept-offer"),
            {"message_id": text_message.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_offer_cannot_be_accepted_twice(self):
        conversation = Conversation.objects.create(
            buyer=self.buyer_profile,
            supplier=self.supplier_profile,
            product=self.product,
            inquiry_text="Initial inquiry",
        )
        offer_message = Message.objects.create(
            conversation=conversation,
            sender=self.supplier_profile,
            message_type=Message.TYPE_OFFER,
            content="Offer for 5 units",
            offer_unit_price=400.00,
            offer_quantity=5,
            is_accepted=True,
        )

        self.client.force_authenticate(user=self.buyer_auth)
        response = self.client.post(
            reverse("messages-accept-offer"),
            {"message_id": offer_message.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
