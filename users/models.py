from django.db import models

# Create your models here.

class User(models.Model):
    ROLE_CHOICES = [
        ('buyer', 'Buyer'),
        ('supplier', 'Supplier'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='buyer')

    def __str__(self):
        return self.name