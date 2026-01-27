from rest_framework.routers import DefaultRouter

from .views import PerformanceReportViewSet, CityWideReportViewSet, DailyCompanyReportViewSet

router = DefaultRouter()
router.register(r"company", PerformanceReportViewSet, basename="company-reports")
router.register(r"citywide", CityWideReportViewSet, basename="citywide-reports")
router.register(r"daily", DailyCompanyReportViewSet, basename="daily-reports")

urlpatterns = router.urls

