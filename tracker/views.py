from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Food, DailyLog, Profile, WeightLog
from .serializers import FoodSerializer, DailyLogSerializer, RegisterSerializer, ProfileSerializer, WeightLogSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from decouple import config
import requests


class ExternalFoodSearchView(APIView):
    """
    GET /api/foods/external-search/?q=banana
    Searches USDA FoodData Central for real foods, so users aren't stuck
    typing nutrition facts by hand for every common food.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        api_key = config("USDA_API_KEY", default="DEMO_KEY")

        try:
            resp = requests.get(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
                params={
                    "query": query,
                    "pageSize": 10,
                    # Foundation + SR Legacy = real analytical food data (raw/whole foods).
                    # Excludes Branded (packaged products, too noisy) and Survey data.
                    "dataType": "Foundation,SR Legacy",
                    "api_key": api_key,
                },
                timeout=6,
            )
        except requests.RequestException:
            return Response(
                {"detail": "Couldn't reach the food database. Try again in a moment."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code == 429:
            return Response(
                {"detail": "Food search rate limit hit. Try again shortly, or set up a free USDA_API_KEY."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        if not resp.ok:
            return Response(
                {"detail": "Food database search failed."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        results = []
        for item in resp.json().get("foods", []):
            nutrients = {n.get("nutrientName"): n.get("value", 0) for n in item.get("foodNutrients", [])}
            calories = nutrients.get("Energy", 0)
            # Analytical USDA data (Foundation/SR Legacy) is always per 100g.
            results.append({
                "fdc_id": item.get("fdcId"),
                "name": item.get("description", "").title(),
                "serving_size": "100g",
                "calories": round(calories),
                "protein": round(nutrients.get("Protein", 0), 1),
                "carbs": round(nutrients.get("Carbohydrate, by difference", 0), 1),
                "fat": round(nutrients.get("Total lipid (fat)", 0), 1),
            })
            if len(results) >= 8:
                break

        return Response(results)


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