from django.db import models

# Create your models here.
from django.db import models
from orders.models import Order

class Logistics(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    status = models.CharField(max_length=50)
    location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.order.id} - {self.status}"