from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import WasteCompany, CompanyZoneAssignment
from .serializers import WasteCompanySerializer, CompanyZoneAssignmentSerializer
from accounts.permissions import IsDirectorate, IsSupervisor, IsWasteCompany


class CentralWasteCompanyViewSet(viewsets.ModelViewSet):
    """
    Central Authority management of waste companies.
    """

    queryset = WasteCompany.objects.all()
    serializer_class = WasteCompanySerializer
    permission_classes = [permissions.IsAuthenticated, (IsDirectorate | IsSupervisor)]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        company = self.get_object()
        company.status = "approved"
        company.approved_by = request.user
        company.approved_at = timezone.now()
        company.save()
        return Response({"detail": "Company approved"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        company = self.get_object()
        company.status = "rejected"
        company.save()
        return Response({"detail": "Company rejected"})

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        company = self.get_object()
        company.status = "suspended"
        company.save()
        return Response({"detail": "Company suspended"})

    @action(detail=True, methods=["post"])
    def assign_zone(self, request, pk=None):
        company = self.get_object()
        serializer = CompanyZoneAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = CompanyZoneAssignment.objects.create(
            company=company,
            zone=serializer.validated_data["zone"],
            assigned_by=request.user,
        )
        return Response(
            CompanyZoneAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


class CompanyDashboardViewSet(viewsets.ViewSet):
    """
    Basic company dashboard statistics.
    """

    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def list(self, request):
        company = WasteCompany.objects.filter(
            # assuming company managers belong to WasteCompany via profile externally
        ).first()
        # Minimal placeholder stats
        data = {
            "company_id": company.id if company else None,
            "fleet_size": company.fleet_size if company else 0,
            "employee_count": company.employee_count if company else 0,
        }
        return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsWasteCompany])
def company_dashboard(request):
    """
    Simple function-based dashboard endpoint mapped to /api/company/dashboard/.
    """
    # This can be expanded to aggregate related stats.
    company = WasteCompany.objects.first()
    data = {
        "company_id": company.id if company else None,
        "fleet_size": company.fleet_size if company else 0,
        "employee_count": company.employee_count if company else 0,
    }
    return Response(data)

