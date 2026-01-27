from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PerformanceReport, CityWideReport
from .serializers import PerformanceReportSerializer, CityWideReportSerializer
from accounts.permissions import IsCentralAuthority


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

