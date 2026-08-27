from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodViewSet

router = DefaultRouter()
router.register(r'foods', FoodViewSet)

urlpatterns = [
    path('', include(router.urls)),
]