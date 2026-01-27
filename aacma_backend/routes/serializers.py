from rest_framework import serializers

from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = "__all__"
        read_only_fields = ["id"]


class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "total_stops", "completed_stops"]

