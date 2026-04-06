from django.db import models
from products.models import Product
from users.models import User


class Conversation(models.Model):
    STATUS_OPEN = "open"
    STATUS_ORDERED = "ordered"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_ORDERED, "Ordered"),
        (STATUS_CLOSED, "Closed"),
    ]

    buyer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="buyer_conversations",
    )
    supplier = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="supplier_conversations",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    inquiry_text = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation #{self.id}"


class Message(models.Model):
    TYPE_TEXT = "text"
    TYPE_OFFER = "offer"
    TYPE_SYSTEM = "system"
    TYPE_CHOICES = [
        (TYPE_TEXT, "Text"),
        (TYPE_OFFER, "Offer"),
        (TYPE_SYSTEM, "System"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    message_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_TEXT,
    )
    content = models.TextField(blank=True)
    offer_unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    offer_quantity = models.PositiveIntegerField(null=True, blank=True)
    offer_delivery_days = models.PositiveIntegerField(null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message #{self.id}"


class Order(models.Model):
    TYPE_ENQUIRY = "enquiry"
    TYPE_ORDER = "order"
    TYPE_CHOICES = [
        (TYPE_ENQUIRY, "Enquiry"),
        (TYPE_ORDER, "Order"),
    ]

    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_RESPONDED = "responded"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_RESPONDED, "Responded"),
    ]

    SHIPPING_AIR = "air"
    SHIPPING_SEA = "sea"
    SHIPPING_CHOICES = [
        (SHIPPING_AIR, "Air"),
        (SHIPPING_SEA, "Sea"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    accepted_offer_message = models.OneToOneField(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_order",
    )
    quantity = models.IntegerField()
    order_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_ORDER,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    shipping_mode = models.CharField(
        max_length=10,
        choices=SHIPPING_CHOICES,
        blank=True,
        default="",
    )
    supplier_response = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    order_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} - {self.product.name} ({self.order_type})"
