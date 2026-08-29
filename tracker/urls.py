from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodViewSet, DailyLogViewSet, RegisterView

router = DefaultRouter()
router.register(r'foods', FoodViewSet)
router.register(r'logs', DailyLogViewSet, basename='dailylog')

urlpatterns = [
    path('', include(router.urls)),
]

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]