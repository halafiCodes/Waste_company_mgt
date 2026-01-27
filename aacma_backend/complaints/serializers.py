from rest_framework import serializers

from .models import WasteReport, ReportComment


class ReportCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = ReportComment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "user"]


class WasteReportSerializer(serializers.ModelSerializer):
    comments = ReportCommentSerializer(many=True, read_only=True)

    class Meta:
        model = WasteReport
        fields = "__all__"
        read_only_fields = [
            "id",
            "resident",
            "assigned_company",
            "assigned_to",
            "resolved_at",
            "reported_at",
            "updated_at",
        ]

