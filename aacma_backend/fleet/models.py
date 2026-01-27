from django.db import models


class Vehicle(models.Model):
    """
    Waste collection vehicles/trucks.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("maintenance", "Under Maintenance"),
    ]

    VEHICLE_TYPES = [
        ("compactor", "Compactor Truck"),
        ("rear_loader", "Rear Loader"),
        ("side_loader", "Side Loader"),
        ("roll_off", "Roll-Off Truck"),
    ]

    id = models.AutoField(primary_key=True)
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    capacity_kg = models.FloatField()
    company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.CASCADE,
        related_name="vehicles",
    )
    current_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="inactive"
    )
    last_location_lat = models.FloatField(null=True, blank=True)
    last_location_lng = models.FloatField(null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    fuel_level = models.IntegerField(default=100)
    mileage = models.IntegerField(default=0)
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.plate_number


class Driver(models.Model):
    """
    Waste collection truck drivers.
    """

    STATUS_CHOICES = [
        ("on_duty", "On Duty"),
        ("off_duty", "Off Duty"),
        ("on_leave", "On Leave"),
    ]

    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="driver_profile",
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.CASCADE,
        related_name="drivers",
    )
    assigned_vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_driver",
    )
    current_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="off_duty"
    )
    total_collections = models.IntegerField(default=0)
    rating = models.FloatField(default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} ({self.license_number})"

