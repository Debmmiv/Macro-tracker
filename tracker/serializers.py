from rest_framework import serializers
from .models import Food, DailyLog, Profile, WeightLog
from django.contrib.auth.models import User

class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'


class DailyLogSerializer(serializers.ModelSerializer):
    # 'food' stays as a plain writable ID (for POST/PATCH). 'food_detail' is
    # read-only and nests the full food info, so GET responses are actually
    # useful to display (name, calories) without a second lookup per entry.
    food_detail = FoodSerializer(source='food', read_only=True)

    class Meta:
        model = DailyLog
        fields = '__all__'
        read_only_fields = ['user']


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['target_weight_kg', 'daily_calorie_target', 'daily_protein_target_g']


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = '__all__'
        read_only_fields = ['user']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        # create_user automatically hashes the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user