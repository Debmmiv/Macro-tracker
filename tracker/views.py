from django.shortcuts import render
from rest_framework import viewsets
from .models import Food, DailyLog
from .serializers import FoodSerializer, DailyLogSerializer, RegisterSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from django.contrib.auth.models import User


class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]

class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users should only see their own logs
        return DailyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically save the current user to the log
        serializer.save(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny] # Open to the public
    serializer_class = RegisterSerializer