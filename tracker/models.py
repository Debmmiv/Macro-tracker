from django.db import models

class Food(models.Model):
    name = models.CharField(max_length=100)
    serving_size_g = models.IntegerField()
    calories = models.IntegerField()
    protein_g = models.DecimalField(max_digits=5, decimal_places=2)
    carbs_g = models.DecimalField(max_digits=5, decimal_places=2)
    fats_g = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.name

class DailyLog(models.Model):
    # Connects the log to Django's built-in User model or a custom user setup later
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    food = models.ForeignKey(Food, on_delete=models.PROTECT)
    date = models.DateField()
    servings_eaten = models.DecimalField(max_digits=5, decimal_places=2)
    logged_at = models.DateTimeField(auto_now_add=True)
