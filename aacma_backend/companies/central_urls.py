from rest_framework.routers import DefaultRouter

from .views import CentralWasteCompanyViewSet

router = DefaultRouter()
router.register(r"", CentralWasteCompanyViewSet, basename="central-companies")

urlpatterns = router.urls

