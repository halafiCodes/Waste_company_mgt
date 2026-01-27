from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("companies", "0001_initial"),
        ("reports", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DailyCompanyReport",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("report_date", models.DateField()),
                ("total_waste_kg", models.FloatField(default=0)),
                ("waste_organic_kg", models.FloatField(default=0)),
                ("waste_plastic_kg", models.FloatField(default=0)),
                ("waste_paper_kg", models.FloatField(default=0)),
                ("waste_metal_kg", models.FloatField(default=0)),
                ("waste_electronic_kg", models.FloatField(default=0)),
                ("waste_hazardous_kg", models.FloatField(default=0)),
                ("service_requests_completed", models.IntegerField(default=0)),
                ("areas_covered", models.TextField(blank=True)),
                ("trucks_used", models.IntegerField(default=0)),
                ("distance_traveled_km", models.FloatField(default=0)),
                ("missed_pickups", models.IntegerField(default=0)),
                ("disposal_site", models.CharField(blank=True, max_length=255)),
                ("recycled_kg", models.FloatField(default=0)),
                ("disposed_kg", models.FloatField(default=0)),
                ("safety_incidents", models.TextField(blank=True)),
                ("photo_evidence", models.ImageField(blank=True, null=True, upload_to="daily_reports/")),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.user",
                    ),
                ),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="daily_reports",
                        to="companies.wastecompany",
                    ),
                ),
            ],
            options={
                "ordering": ["-report_date", "-created_at"],
            },
        ),
    ]
