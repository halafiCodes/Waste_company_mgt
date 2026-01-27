from django.contrib import admin
from .models import PerformanceReport, CityWideReport


admin.site.register(PerformanceReport)
admin.site.register(CityWideReport)