from django.contrib import admin

from .models import Food, DailyLog, Profile, WeightLog

admin.site.register(Food)
admin.site.register(DailyLog)
admin.site.register(Profile)
admin.site.register(WeightLog)