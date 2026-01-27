from rest_framework.routers import DefaultRouter

from .views import PolicyViewSet, ApprovalRequestViewSet

router = DefaultRouter()
router.register("policies", PolicyViewSet, basename="policies")
router.register("approvals", ApprovalRequestViewSet, basename="approvals")

urlpatterns = router.urls
