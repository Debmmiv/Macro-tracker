from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodViewSet, DailyLogViewSet, RegisterView, ProfileView, WeightLogViewSet, ExternalFoodSearchView

router = DefaultRouter()
router.register(r'foods', FoodViewSet)
router.register(r'logs', DailyLogViewSet, basename='dailylog')
router.register(r'weights', WeightLogViewSet, basename='weightlog')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('foods/external-search/', ExternalFoodSearchView.as_view(), name='external-food-search'),
    path('', include(router.urls)),
]