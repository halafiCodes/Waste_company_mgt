from rest_framework.routers import DefaultRouter

from .views import PerformanceReportViewSet, CityWideReportViewSet

router = DefaultRouter()
router.register(r"company", PerformanceReportViewSet, basename="company-reports")
router.register(r"citywide", CityWideReportViewSet, basename="citywide-reports")

urlpatterns = router.urls

