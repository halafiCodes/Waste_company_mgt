from django.db import models


def validate_addis_coordinates(lat: float | None, lng: float | None) -> None:
    """
    Very simple GPS validation to ensure coordinates are roughly within Addis Ababa.

    Approx bounding box: lat 8.8 - 9.1, lng 38.6 - 39.0
    """
    if lat is None or lng is None:
        return
    if not (8.8 <= lat <= 9.1 and 38.6 <= lng <= 39.0):
        raise ValueError("Coordinates must be within Addis Ababa boundaries.")


class CollectionRequest(models.Model):
    """
    Waste collection requests from residents.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("assigned", "Assigned"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    WASTE_TYPES = [
        ("general", "General Waste"),
        ("recyclable", "Recyclable"),
        ("hazardous", "Hazardous"),
        ("organic", "Organic/Compostable"),
        ("bulky", "Bulky Items"),
    ]

    TIME_PREFERENCES = [
        ("morning", "Morning (6AM-12PM)"),
        ("afternoon", "Afternoon (12PM-6PM)"),
        ("evening", "Evening (6PM-9PM)"),
    ]

    id = models.AutoField(primary_key=True)
    resident = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="collection_requests",
    )
    waste_type = models.CharField(max_length=20, choices=WASTE_TYPES)
    quantity_bags = models.IntegerField(default=1)
    estimated_weight_kg = models.FloatField(null=True, blank=True)
    preferred_date = models.DateField()
    preferred_time = models.CharField(max_length=20, choices=TIME_PREFERENCES)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    assigned_company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    assigned_vehicle = models.ForeignKey(
        "fleet.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    assigned_driver = models.ForeignKey(
        "fleet.Driver",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    collected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        validate_addis_coordinates(self.latitude, self.longitude)

    def __str__(self) -> str:
        return f"Request {self.id} - {self.resident}"


class CollectionRecord(models.Model):
    """
    Record of completed waste collections (proof of service).
    """

    id = models.AutoField(primary_key=True)
    collection_request = models.OneToOneField(
        CollectionRequest,
        on_delete=models.CASCADE,
        related_name="record",
    )
    vehicle = models.ForeignKey("fleet.Vehicle", on_delete=models.SET_NULL, null=True)
    driver = models.ForeignKey("fleet.Driver", on_delete=models.SET_NULL, null=True)
    collected_at = models.DateTimeField()
    actual_weight_kg = models.FloatField(null=True, blank=True)
    photo_proof = models.ImageField(
        upload_to="collection_proofs/", null=True, blank=True
    )
    resident_signature = models.TextField(blank=True)
    driver_notes = models.TextField(blank=True)
    rating = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Record for request {self.collection_request_id}"

