from rest_framework import serializers
from .models import Order
from users.models import User
from products.models import Product


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']


class ProductNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price']


class OrderSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    product = ProductNestedSerializer(read_only=True)

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Order
        fields = '__all__'