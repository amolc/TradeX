# Generated manually for inquiry/chat/order flow

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_product_supplier_alter_product_name"),
        ("users", "0002_alter_user_role"),
        ("orders", "0002_order_order_type_order_shipping_mode_order_status_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Conversation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("inquiry_text", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("open", "Open"),
                            ("ordered", "Ordered"),
                            ("closed", "Closed"),
                        ],
                        default="open",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "buyer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="buyer_conversations",
                        to="users.user",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversations",
                        to="products.product",
                    ),
                ),
                (
                    "supplier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="supplier_conversations",
                        to="users.user",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "message_type",
                    models.CharField(
                        choices=[
                            ("text", "Text"),
                            ("offer", "Offer"),
                            ("system", "System"),
                        ],
                        default="text",
                        max_length=20,
                    ),
                ),
                ("content", models.TextField(blank=True)),
                (
                    "offer_unit_price",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=12,
                        null=True,
                    ),
                ),
                ("offer_quantity", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "offer_delivery_days",
                    models.PositiveIntegerField(blank=True, null=True),
                ),
                ("is_accepted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="orders.conversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="users.user",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="order",
            name="accepted_offer_message",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="accepted_order",
                to="orders.message",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="conversation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="orders",
                to="orders.conversation",
            ),
        ),
    ]
