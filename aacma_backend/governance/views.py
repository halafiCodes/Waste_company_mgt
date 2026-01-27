from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCentralAuthority
from .models import Policy, ApprovalRequest
from .serializers import PolicySerializer, ApprovalRequestSerializer


class PolicyViewSet(viewsets.ModelViewSet):
    queryset = Policy.objects.select_related("created_by").all()
    serializer_class = PolicySerializer
    permission_classes = [permissions.IsAuthenticated, IsCentralAuthority]
    filterset_fields = ["status", "category"]
    search_fields = ["title", "category", "description"]
    ordering_fields = ["created_at", "updated_at", "effective_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        policy = self.get_object()
        policy.publish()
        return Response(self.get_serializer(policy).data)

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request, pk=None):
        policy = self.get_object()
        status_value = request.data.get("status")
        valid_statuses = {choice[0] for choice in Policy.STATUS_CHOICES}
        if status_value not in valid_statuses:
            return Response(
                {"detail": "Invalid status value"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        policy.status = status_value
        if status_value == "active":
            policy.published_at = timezone.now()
        policy.save(update_fields=["status", "published_at", "updated_at"])
        return Response(self.get_serializer(policy).data)


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.select_related("requested_by", "approver", "policy").all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsCentralAuthority]
    filterset_fields = ["status", "request_type"]
    search_fields = ["item_name", "description", "request_type"]
    ordering_fields = ["created_at", "decided_at"]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user, status="pending")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        approval = self.get_object()
        if approval.status != "pending":
            return Response(
                {"detail": "Request already processed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approval.approve(request.user, request.data.get("decision_notes"))
        return Response(self.get_serializer(approval).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        approval = self.get_object()
        if approval.status != "pending":
            return Response(
                {"detail": "Request already processed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approval.reject(request.user, request.data.get("decision_notes"))
        return Response(self.get_serializer(approval).data)
