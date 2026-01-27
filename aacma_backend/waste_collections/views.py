from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CollectionRequest, CollectionRecord
from .serializers import CollectionRequestSerializer, CollectionRecordSerializer
from accounts.permissions import IsWasteCompany, IsResident


class ResidentCollectionRequestViewSet(viewsets.ModelViewSet):
    """
    Resident-facing CRUD for their own collection requests.
    """

    serializer_class = CollectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsResident]

    def get_queryset(self):
        return CollectionRequest.objects.filter(resident=self.request.user)

    def perform_create(self, serializer):
        serializer.save(resident=self.request.user)

    @action(detail=True, methods=["get"])
    def track(self, request, pk=None):
        req = self.get_object()
        data = {
            "status": req.status,
            "status_display": req.get_status_display(),
            "estimated_arrival": req.estimated_arrival,
            "collected_at": req.collected_at,
        }
        return Response(data)


class CompanyCollectionRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Company view into pending/assigned requests.
    """

    serializer_class = CollectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def get_queryset(self):
        return CollectionRequest.objects.all()

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        req = self.get_object()
        req.status = "assigned"
        # In a full impl, bind to driver/vehicle/company
        req.save()
        return Response(self.get_serializer(req).data)

    @action(detail=True, methods=["put"])
    def status(self, request, pk=None):
        req = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(CollectionRequest.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.status = status_value
        req.save()
        return Response(self.get_serializer(req).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        req = self.get_object()
        req.status = "completed"
        req.collected_at = timezone.now()
        req.save()
        record, _ = CollectionRecord.objects.get_or_create(
            collection_request=req,
            defaults={
                "vehicle": req.assigned_vehicle,
                "driver": req.assigned_driver,
                "collected_at": req.collected_at,
            },
        )
        return Response(
            {
                "request": self.get_serializer(req).data,
                "record": CollectionRecordSerializer(record).data,
            }
        )

