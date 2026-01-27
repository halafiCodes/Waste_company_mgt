from django.db import models


class Route(models.Model):
    """
    Collection routes with multiple stops.
    """

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.CASCADE,
        related_name="routes",
    )
    zone = models.ForeignKey("zones.Zone", on_delete=models.CASCADE)
    assigned_vehicle = models.ForeignKey(
        "fleet.Vehicle", on_delete=models.SET_NULL, null=True, blank=True
    )
    assigned_driver = models.ForeignKey(
        "fleet.Driver", on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="scheduled"
    )
    scheduled_date = models.DateField()
    scheduled_start_time = models.TimeField()
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    total_stops = models.IntegerField(default=0)
    completed_stops = models.IntegerField(default=0)
    total_distance_km = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class RouteStop(models.Model):
    """
    Individual stops along a route.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("skipped", "Skipped"),
    ]

    id = models.AutoField(primary_key=True)
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="stops"
    )
    sequence_number = models.IntegerField()
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    resident = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    collection_request = models.ForeignKey(
        "collections.CollectionRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["route", "sequence_number"]

    def __str__(self) -> str:
        return f"{self.route.name} - Stop {self.sequence_number}"

