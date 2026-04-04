from rest_framework import serializers
from .models import Order
from users.models import User
from products.models import Product


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']


class ProductNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price']


class OrderSerializer(serializers.ModelSerializer):
    # 🔹 Read (GET)
    user = UserNestedSerializer(read_only=True)
    product = ProductNestedSerializer(read_only=True)

    # 🔹 Write (POST)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'product',
            'product_id',
            'quantity',
            'order_date'
        ]