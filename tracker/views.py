from django.shortcuts import render
from rest_framework import viewsets
from .models import Food
from .serializer import FoodSerializer

class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer