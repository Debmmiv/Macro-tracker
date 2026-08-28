from django.contrib import admin

from .models import Food, DailyLog

admin.site.register(Food)
admin.site.register(DailyLog)
