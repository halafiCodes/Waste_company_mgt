from rest_framework.routers import DefaultRouter

from .views import ResidentWasteReportViewSet

resident_router = DefaultRouter()
resident_router.register(
    r"resident/complaints", ResidentWasteReportViewSet, basename="resident-complaints"
)

urlpatterns = resident_router.urls

