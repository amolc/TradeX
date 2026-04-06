"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from users.views import TradeXTokenObtainPairView
from products.views import ProductViewSet
from orders.views import ConversationViewSet, OrderViewSet
from logistics.views import LogisticsViewSet
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'logistics', LogisticsViewSet, basename='logistics')


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    
    path('api/token/', TradeXTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
