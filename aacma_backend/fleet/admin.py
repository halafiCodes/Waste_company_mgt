from django.contrib import admin
from .models import Driver, Vehicle


admin.site.register(Vehicle)
admin.site.register(Driver)