from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Food, DailyLog, Profile, WeightLog
from .serializers import FoodSerializer, DailyLogSerializer, RegisterSerializer, ProfileSerializer, WeightLogSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User


class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users should only see their own logs
        return DailyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically save the current user to the log
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        # GET /api/logs/today/ - just this user's logs for today
        todays_logs = self.get_queryset().filter(date=timezone.localdate())
        serializer = self.get_serializer(todays_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        # GET /api/logs/summary/ - today's totals vs. the user's targets (for the progress ring)
        todays_logs = self.get_queryset().filter(date=timezone.localdate())

        totals = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
        for log in todays_logs.select_related('food'):
            totals['calories'] += log.food.calories * log.servings
            totals['protein'] += log.food.protein * log.servings
            totals['carbs'] += log.food.carbs * log.servings
            totals['fat'] += log.food.fat * log.servings

        profile, _ = Profile.objects.get_or_create(user=request.user)

        return Response({
            'date': timezone.localdate(),
            'totals': totals,
            'targets': {
                'daily_calorie_target': profile.daily_calorie_target,
                'daily_protein_target_g': profile.daily_protein_target_g,
            },
        })


class WeightLogViewSet(viewsets.ModelViewSet):
    serializer_class = WeightLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users should only see their own weight entries
        return WeightLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        # Auto-create an empty profile the first time a user hits this endpoint
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny] # Open to the public
    serializer_class = RegisterSerializer