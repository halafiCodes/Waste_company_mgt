from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import WasteReport, ReportComment
from .serializers import WasteReportSerializer, ReportCommentSerializer
from accounts.permissions import IsResident, IsCentralAuthority


class ResidentWasteReportViewSet(viewsets.ModelViewSet):
    """
    Resident complaint API.
    """

    serializer_class = WasteReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsResident]

    def get_queryset(self):
        return WasteReport.objects.filter(resident=self.request.user)

    def perform_create(self, serializer):
        serializer.save(resident=self.request.user)


class CentralWasteReportViewSet(viewsets.ModelViewSet):
    """
    Central Authority view of all complaints.
    """

    queryset = WasteReport.objects.all()
    serializer_class = WasteReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsCentralAuthority]

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        report = self.get_object()
        response_text = request.data.get("response", "")
        report.response = response_text
        report.status = "resolved"
        report.resolved_at = timezone.now()
        report.save()
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"])
    def escalate(self, request, pk=None):
        report = self.get_object()
        report.status = "escalated"
        report.save()
        return Response(self.get_serializer(report).data)


class ReportCommentViewSet(viewsets.ModelViewSet):
    queryset = ReportComment.objects.all()
    serializer_class = ReportCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

