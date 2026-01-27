from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CompanyRouteViewSet, DriverRouteViewSet

router = DefaultRouter()
router.register(r"", CompanyRouteViewSet, basename="company-routes")

driver_router = DefaultRouter()
driver_router.register(r"driver/route", DriverRouteViewSet, basename="driver-route")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(driver_router.urls)),
]

