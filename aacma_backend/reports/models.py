from django.db import models


class PerformanceReport(models.Model):
    """
    Company performance reports.
    """

    REPORT_PERIODS = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("yearly", "Yearly"),
    ]

    id = models.AutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.CASCADE,
        related_name="performance_reports",
    )
    period = models.CharField(max_length=20, choices=REPORT_PERIODS)
    start_date = models.DateField()
    end_date = models.DateField()
    total_collections = models.IntegerField(default=0)
    completed_collections = models.IntegerField(default=0)
    missed_collections = models.IntegerField(default=0)
    average_response_time_hours = models.FloatField(default=0)
    total_waste_collected_kg = models.FloatField(default=0)
    recycled_waste_kg = models.FloatField(default=0)
    customer_satisfaction_rating = models.FloatField(default=0)
    complaints_received = models.IntegerField(default=0)
    complaints_resolved = models.IntegerField(default=0)
    generated_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.company} {self.period} report"


class CityWideReport(models.Model):
    """
    City-wide analytics reports for Central Authority.
    """

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    period_start = models.DateField()
    period_end = models.DateField()
    total_waste_generated_tons = models.FloatField(default=0)
    total_waste_collected_tons = models.FloatField(default=0)
    recycling_rate_percentage = models.FloatField(default=0)
    active_companies = models.IntegerField(default=0)
    active_vehicles = models.IntegerField(default=0)
    active_zones = models.IntegerField(default=0)
    total_requests = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0)
    average_response_time = models.FloatField(default=0)
    zone_breakdown = models.JSONField(default=dict, blank=True)
    company_breakdown = models.JSONField(default=dict, blank=True)
    generated_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class DailyCompanyReport(models.Model):
    """
    Daily operational report submitted by waste companies.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.AutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.WasteCompany",
        on_delete=models.CASCADE,
        related_name="daily_reports",
    )
    report_date = models.DateField()
    total_waste_kg = models.FloatField(default=0)
    waste_organic_kg = models.FloatField(default=0)
    waste_plastic_kg = models.FloatField(default=0)
    waste_paper_kg = models.FloatField(default=0)
    waste_metal_kg = models.FloatField(default=0)
    waste_electronic_kg = models.FloatField(default=0)
    waste_hazardous_kg = models.FloatField(default=0)
    service_requests_completed = models.IntegerField(default=0)
    areas_covered = models.TextField(blank=True)
    trucks_used = models.IntegerField(default=0)
    distance_traveled_km = models.FloatField(default=0)
    missed_pickups = models.IntegerField(default=0)
    disposal_site = models.CharField(max_length=255, blank=True)
    recycled_kg = models.FloatField(default=0)
    disposed_kg = models.FloatField(default=0)
    safety_incidents = models.TextField(blank=True)
    photo_evidence = models.ImageField(upload_to="daily_reports/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    approved_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.company} {self.report_date}"

