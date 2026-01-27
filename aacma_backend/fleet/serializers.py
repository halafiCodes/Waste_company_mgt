from rest_framework import serializers

from .models import Vehicle, Driver


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "last_location_update"]


class DriverSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = Driver
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "total_collections", "rating"]

