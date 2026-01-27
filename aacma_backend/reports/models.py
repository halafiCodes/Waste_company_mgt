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

