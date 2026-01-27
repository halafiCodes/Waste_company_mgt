from rest_framework import serializers

from .models import PerformanceReport, CityWideReport


class PerformanceReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReport
        fields = "__all__"
        read_only_fields = ["id", "created_at", "generated_by"]


class CityWideReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CityWideReport
        fields = "__all__"
        read_only_fields = ["id", "created_at", "generated_by"]

