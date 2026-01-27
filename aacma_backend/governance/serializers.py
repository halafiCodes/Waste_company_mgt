from rest_framework import serializers

from .models import Policy, ApprovalRequest


class PolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Policy
        fields = [
            "id",
            "title",
            "category",
            "description",
            "status",
            "effective_date",
            "created_by",
            "created_by_name",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "published_at",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj: Policy) -> str:
        if obj.created_by:
            full_name = obj.created_by.get_full_name().strip()
            return full_name or obj.created_by.username
        return "System"


class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    approver_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            "id",
            "request_type",
            "item_name",
            "description",
            "status",
            "requested_by",
            "requested_by_name",
            "approver",
            "approver_name",
            "decision_notes",
            "decided_at",
            "metadata",
            "policy",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "requested_by",
            "requested_by_name",
            "approver",
            "approver_name",
            "decided_at",
            "created_at",
            "updated_at",
        ]

    def get_requested_by_name(self, obj: ApprovalRequest) -> str:
        if obj.requested_by:
            full_name = obj.requested_by.get_full_name().strip()
            return full_name or obj.requested_by.username
        return "System"

    def get_approver_name(self, obj: ApprovalRequest) -> str:
        if obj.approver:
            full_name = obj.approver.get_full_name().strip()
            return full_name or obj.approver.username
        return ""
