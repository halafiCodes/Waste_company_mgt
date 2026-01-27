from rest_framework.routers import DefaultRouter

from .views import CompanyVehicleViewSet, CompanyDriverViewSet

router = DefaultRouter()
router.register(r"vehicles", CompanyVehicleViewSet, basename="company-vehicles")
router.register(r"drivers", CompanyDriverViewSet, basename="company-drivers")

urlpatterns = router.urls

