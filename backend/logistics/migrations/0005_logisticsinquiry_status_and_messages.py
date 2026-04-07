# Generated manually for logistics inquiry messaging

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("logistics", "0004_logisticsinquiry_weight"),
    ]

    operations = [
        migrations.AddField(
            model_name="logisticsinquiry",
            name="status",
            field=models.CharField(
                choices=[
                    ("open", "Open"),
                    ("replied", "Replied"),
                    ("closed", "Closed"),
                ],
                default="open",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="LogisticsInquiryMessage",
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
                    "sender_role",
                    models.CharField(
                        choices=[
                            ("buyer", "Buyer"),
                            ("supplier", "Supplier"),
                            ("admin", "Admin"),
                        ],
                        max_length=20,
                    ),
                ),
                ("sender_name", models.CharField(max_length=100)),
                ("sender_email", models.EmailField(blank=True, max_length=254)),
                ("message", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "inquiry",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="logistics.logisticsinquiry",
                    ),
                ),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
    ]
