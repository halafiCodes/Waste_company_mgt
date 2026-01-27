from django.db import models


class Zone(models.Model):
    """
    Geographic zones/sub-cities of Addis Ababa.
    """

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    boundaries = models.JSONField(null=True, blank=True)
    population_estimate = models.IntegerField(default=0)
    area_sqkm = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

