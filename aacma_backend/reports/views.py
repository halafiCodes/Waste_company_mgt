from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PerformanceReport, CityWideReport, DailyCompanyReport
from .serializers import PerformanceReportSerializer, CityWideReportSerializer, DailyCompanyReportSerializer
from accounts.permissions import IsCentralAuthority, IsWasteCompany, IsSupervisor
from companies.models import WasteCompany


class PerformanceReportViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReport.objects.all()
    serializer_class = PerformanceReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)


class CityWideReportViewSet(viewsets.ModelViewSet):
    queryset = CityWideReport.objects.all()
    serializer_class = CityWideReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsCentralAuthority]

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        Placeholder for async heavy analytics generation.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(generated_by=request.user)
        return Response(self.get_serializer(report).data, status=status.HTTP_201_CREATED)


class DailyCompanyReportViewSet(viewsets.ModelViewSet):
    serializer_class = DailyCompanyReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany | IsCentralAuthority]
    parser_classes = [MultiPartParser, FormParser]

    def _get_company(self):
        company = getattr(self.request.user, "company", None)
        if company:
            return company
        return WasteCompany.objects.first()

    def get_queryset(self):
        if getattr(self.request.user, "user_type", None) == "waste_company":
            company = self._get_company()
            return DailyCompanyReport.objects.filter(company=company) if company else DailyCompanyReport.objects.none()
        return DailyCompanyReport.objects.all()

    def perform_create(self, serializer):
        company = self._get_company()
        serializer.save(company=company)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSupervisor])
    def approve(self, request, pk=None):
        report = self.get_object()
        report.status = "approved"
        report.approved_by = request.user
        report.approved_at = timezone.now()
        report.save()
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsSupervisor])
    def reject(self, request, pk=None):
        report = self.get_object()
        report.status = "rejected"
        report.approved_by = request.user
        report.approved_at = timezone.now()
        report.save()
        return Response(self.get_serializer(report).data)

