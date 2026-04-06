from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer


AuthUser = get_user_model()


class TradeXTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "").strip()

        auth_user = (
            AuthUser.objects.filter(email__iexact=identifier).first()
            or AuthUser.objects.filter(username__iexact=identifier).first()
        )

        if auth_user is None:
            profile = User.objects.filter(name__iexact=identifier).first()
            if profile is not None:
                auth_user = AuthUser.objects.filter(email__iexact=profile.email).first()

        if auth_user is None:
            raise AuthenticationFailed("No active account found with the given credentials")

        attrs[self.username_field] = auth_user.get_username()
        data = super().validate(attrs)
        data["user"] = {
            "id": auth_user.id,
            "username": auth_user.get_username(),
            "email": auth_user.email,
            "is_staff": auth_user.is_staff,
            "is_superuser": auth_user.is_superuser,
            "is_admin": auth_user.is_staff or auth_user.is_superuser,
        }
        return data


class TradeXTokenObtainPairView(TokenObtainPairView):
    serializer_class = TradeXTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
