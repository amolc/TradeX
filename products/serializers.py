from rest_framework import serializers
from .models import Product
from users.models import User


class SupplierNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']


class ProductSerializer(serializers.ModelSerializer):
    # 🔹 Read (GET)
    supplier = SupplierNestedSerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'quantity',
            'supplier'
        ]