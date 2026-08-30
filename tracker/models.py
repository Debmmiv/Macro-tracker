from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Food(models.Model):
    name = models.CharField(max_length=100)
    serving_size = models.CharField(max_length=50)
    calories = models.IntegerField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()

    def __str__(self):
        return self.name

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    target_weight_kg = models.FloatField(null=True, blank=True)
    daily_calorie_target = models.FloatField(null=True, blank=True)
    daily_protein_target_g = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class DailyLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    food = models.ForeignKey(Food, on_delete=models.PROTECT)
    servings = models.FloatField(default=1.0)
    date = models.DateField(default=timezone.localdate)

    def __str__(self):
        return f"{self.user.username} - {self.food.name} ({self.date})"

class WeightLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weight_logs')
    weight_kg = models.FloatField()
    date = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.weight_kg}kg ({self.date})"