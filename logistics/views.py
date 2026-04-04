from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated

# Create your views here.
from rest_framework import viewsets
from .models import Logistics
from .serializers import LogisticsSerializer

class LogisticsViewSet(viewsets.ModelViewSet):
    queryset = Logistics.objects.all()
    serializer_class = LogisticsSerializer  
    permission_classes = [IsAuthenticated]
    