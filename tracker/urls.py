from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodViewSet, DailyLogViewSet

router = DefaultRouter()
router.register(r'foods', FoodViewSet)
router.register(r'logs', DailyLogViewSet, basename='dailylog')

urlpatterns = [
    path('', include(router.urls)),
]