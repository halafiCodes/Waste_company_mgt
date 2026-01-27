from django.db import models
from django.conf import settings


class WasteCompany(models.Model):
    """
    Registered waste management companies.
    """

    STATUS_CHOICES = [
        ("pending", "Pending Approval"),
        ("approved", "Approved"),
        ("suspended", "Suspended"),
        ("rejected", "Rejected"),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=50, unique=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    assigned_zones = models.ManyToManyField(
        "zones.Zone", through="CompanyZoneAssignment", related_name="companies"
    )
    fleet_size = models.IntegerField(default=0)
    employee_count = models.IntegerField(default=0)
    registration_date = models.DateField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approved_companies",
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class CompanyZoneAssignment(models.Model):
    """
    Assignment of zones to waste companies.
    """

    company = models.ForeignKey(WasteCompany, on_delete=models.CASCADE)
    zone = models.ForeignKey("zones.Zone", on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["company", "zone"]

    def __str__(self) -> str:
        return f"{self.company} - {self.zone}"

