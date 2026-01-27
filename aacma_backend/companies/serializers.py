from rest_framework import serializers

from .models import WasteCompany, CompanyZoneAssignment
from zones.serializers import ZoneSerializer


class CompanyZoneAssignmentSerializer(serializers.ModelSerializer):
    zone = ZoneSerializer(read_only=True)
    zone_id = serializers.PrimaryKeyRelatedField(
        source="zone", queryset=CompanyZoneAssignment._meta.get_field("zone").remote_field.model.objects.all(), write_only=True
    )

    class Meta:
        model = CompanyZoneAssignment
        fields = ["id", "company", "zone", "zone_id", "assigned_by", "assigned_at", "is_active"]
        read_only_fields = ["id", "assigned_at", "assigned_by", "company"]


class WasteCompanySerializer(serializers.ModelSerializer):
    assigned_zones_detail = ZoneSerializer(source="assigned_zones", many=True, read_only=True)

    class Meta:
        model = WasteCompany
        fields = "__all__"
        read_only_fields = ["id", "registration_date", "created_at", "updated_at", "approved_by", "approved_at"]

