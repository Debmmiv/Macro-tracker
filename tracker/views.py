from django.shortcuts import render
from rest_framework import viewsets
from .models import Food, DailyLog
from .serializers import FoodSerializer, DailyLogSerializer
from rest_framework.permissions import IsAuthenticated


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