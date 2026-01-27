from django.db import models


class WasteReport(models.Model):
    """
    Complaints and emergency reports from residents.
    """

    REPORT_TYPES = [
        ("missed_collection", "Missed Collection"),
        ("late_pickup", "Late Pickup"),
        ("service_quality", "Service Quality Issue"),
        ("illegal_dumping", "Illegal Dumping"),
        ("hazardous_spill", "Hazardous Spill"),
        ("medical_waste", "Medical Waste Emergency"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("investigating", "Investigating"),
        ("escalated", "Escalated"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("emergency", "Emergency"),
    ]

    id = models.AutoField(primary_key=True)
    resident = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="waste_reports",
    )
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    description = models.TextField()
    location_address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    photo_evidence = models.ImageField(
        upload_to="report_evidence/", null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="open"
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium"
    )
    assigned_company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_reports",
    )
    response = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Report {self.id}"


class ReportComment(models.Model):
    """
    Comments/updates on a waste report.
    """

    id = models.AutoField(primary_key=True)
    report = models.ForeignKey(
        WasteReport, on_delete=models.CASCADE, related_name="comments"
    )
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    comment = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Comment {self.id} on report {self.report_id}"

