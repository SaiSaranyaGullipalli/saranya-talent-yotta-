
from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_staff",
        ]

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return "ADMIN"

        return "RECRUITER"
