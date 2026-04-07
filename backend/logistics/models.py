from django.db import models
from orders.models import Order
from users.models import User


class Logistics(models.Model):
    STATUS_PENDING = "pending"
    STATUS_IN_TRANSIT = "in_transit"
    STATUS_SHIPPED = "shipped"
    STATUS_DELIVERED = "delivered"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_IN_TRANSIT, "In Transit"),
        (STATUS_SHIPPED, "Shipped"),
        (STATUS_DELIVERED, "Delivered"),
    ]

    STAGE_SUPPLIER = "supplier"
    STAGE_WAREHOUSE = "warehouse"
    STAGE_TRANSPORT = "transport"
    STAGE_DELIVERY = "delivery"
    STAGE_FINAL_DESTINATION = "final_destination"
    STAGE_CHOICES = [
        (STAGE_SUPPLIER, "Supplier"),
        (STAGE_WAREHOUSE, "Warehouse"),
        (STAGE_TRANSPORT, "Transport"),
        (STAGE_DELIVERY, "Delivery"),
        (STAGE_FINAL_DESTINATION, "Final Destination"),
    ]

    SHIPPING_AIR = "air"
    SHIPPING_SEA = "sea"
    SHIPPING_CHOICES = [
        (SHIPPING_AIR, "Air"),
        (SHIPPING_SEA, "Sea"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    tracking_stage = models.CharField(
        max_length=30,
        choices=STAGE_CHOICES,
        default=STAGE_SUPPLIER,
    )
    shipping_mode = models.CharField(
        max_length=10,
        choices=SHIPPING_CHOICES,
        blank=True,
        default="",
    )
    location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.order.id} - {self.status}"


class LogisticsInquiry(models.Model):
    STATUS_OPEN = "open"
    STATUS_REPLIED = "replied"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_REPLIED, "Replied"),
        (STATUS_CLOSED, "Closed"),
    ]

    SERVICE_SEA = "sea"
    SERVICE_AIR = "air"
    SERVICE_WAREHOUSE = "warehouse"
    SERVICE_CHOICES = [
        (SERVICE_SEA, "Sea Freight"),
        (SERVICE_AIR, "Air Freight"),
        (SERVICE_WAREHOUSE, "Warehousing"),
    ]

    buyer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="logistics_inquiries",
    )
    name = models.CharField(max_length=100)
    email = models.EmailField()
    service_type = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    cargo_type = models.CharField(max_length=100)
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    quantity = models.CharField(max_length=100)
    weight = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    telegram_username = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry #{self.id} - {self.name}"


class LogisticsInquiryMessage(models.Model):
    SENDER_BUYER = "buyer"
    SENDER_SUPPLIER = "supplier"
    SENDER_ADMIN = "admin"
    SENDER_CHOICES = [
        (SENDER_BUYER, "Buyer"),
        (SENDER_SUPPLIER, "Supplier"),
        (SENDER_ADMIN, "Admin"),
    ]

    inquiry = models.ForeignKey(
        LogisticsInquiry,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender_role = models.CharField(max_length=20, choices=SENDER_CHOICES)
    sender_name = models.CharField(max_length=100)
    sender_email = models.EmailField(blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Logistics inquiry #{self.inquiry_id} message #{self.id}"
