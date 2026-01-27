from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Vehicle, Driver
from .serializers import VehicleSerializer, DriverSerializer
from accounts.permissions import IsWasteCompany


class CompanyVehicleViewSet(viewsets.ModelViewSet):
    """
    Company-scoped vehicle management.
    """

    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def _get_company(self):
        CompanyModel = Vehicle._meta.get_field("company").remote_field.model
        company = getattr(self.request.user, "company", None)
        if not company:
            company = CompanyModel.objects.first()
        if not company:
            company = CompanyModel.objects.create(
                name="Green Clean Services",
                license_number="LIC-DEFAULT",
                contact_email="contact@example.com",
                contact_phone="000",
                address="Addis Ababa",
                status="approved",
            )
        return company

    def get_queryset(self):
        company = self._get_company()
        return Vehicle.objects.filter(company=company)

    def create(self, request, *args, **kwargs):
        company = self._get_company()
        data = request.data.copy()
        data["company"] = company.id
        if "current_status" not in data:
            data["current_status"] = "active"
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["put"])
    def location(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.last_location_lat = request.data.get("last_location_lat")
        vehicle.last_location_lng = request.data.get("last_location_lng")
        vehicle.last_location_update = timezone.now()
        vehicle.save()
        return Response(self.get_serializer(vehicle).data)

    @action(detail=True, methods=["put"])
    def status(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.current_status = request.data.get("current_status", vehicle.current_status)
        vehicle.save()
        return Response(self.get_serializer(vehicle).data)


class CompanyDriverViewSet(viewsets.ModelViewSet):
    """
    Company-scoped driver management.
    """

    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def get_queryset(self):
        # In a full implementation, filter by request.user's company
        return Driver.objects.select_related("user").all()

    def create(self, request, *args, **kwargs):
        data = request.data
        full_name = data.get("full_name") or ""
        first_name, last_name = (full_name.split(" ", 1) + [""])[:2]
        email = data.get("email")
        phone = data.get("phone", "")
        username = data.get("username") or (email.split("@")[0] if email else f"driver_{Driver.objects.count()+1}")
        license_number = data.get("license_number")
        license_expiry = data.get("license_expiry")
        current_status = data.get("current_status", "off_duty")
        assigned_vehicle_id = data.get("assigned_vehicle")

        if not license_number:
            return Response({"detail": "license_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.models import Role, User

        driver_role = Role.objects.filter(slug="driver").first()
        company = Driver._meta.get_field("company").remote_field.model.objects.first()

        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email or f"{username}@example.com",
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "user_type": "waste_company",
                "role": driver_role,
            },
        )
        if not user.has_usable_password():
            user.set_password("Driver@2029")
        user.role = driver_role
        user.user_type = "waste_company"
        user.save()

        assigned_vehicle = None
        if assigned_vehicle_id:
            assigned_vehicle = Vehicle.objects.filter(id=assigned_vehicle_id).first()

        driver, created = Driver.objects.get_or_create(
            user=user,
            defaults={
                "license_number": license_number,
                "license_expiry": license_expiry,
                "company": company,
                "assigned_vehicle": assigned_vehicle,
                "current_status": current_status,
            },
        )
        if not created:
            driver.license_number = license_number
            driver.license_expiry = license_expiry or driver.license_expiry
            driver.company = company
            driver.assigned_vehicle = assigned_vehicle
            driver.current_status = current_status
            driver.save()

        serializer = self.get_serializer(driver)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        driver = self.get_object()
        vehicle_id = request.data.get("vehicle_id")
        if not vehicle_id:
            return Response(
                {"detail": "vehicle_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response(
                {"detail": "Vehicle not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        driver.assigned_vehicle = vehicle
        driver.save()
        return Response(self.get_serializer(driver).data)

