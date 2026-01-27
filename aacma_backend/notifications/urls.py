from rest_framework.routers import DefaultRouter

from .views import UserNotificationViewSet

router = DefaultRouter()
router.register(r"", UserNotificationViewSet, basename="notifications")

urlpatterns = router.urls

