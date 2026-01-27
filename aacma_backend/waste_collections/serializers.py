from rest_framework import serializers

from .models import CollectionRequest, CollectionRecord


class CollectionRequestSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(
        source="resident.get_full_name", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = CollectionRequest
        fields = "__all__"
        read_only_fields = [
            "id",
            "resident",
            "created_at",
            "updated_at",
            "assigned_company",
            "assigned_vehicle",
            "assigned_driver",
            "estimated_arrival",
            "collected_at",
        ]


class CollectionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionRecord
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

