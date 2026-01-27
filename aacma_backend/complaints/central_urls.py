from rest_framework.routers import DefaultRouter

from .views import CentralWasteReportViewSet, ReportCommentViewSet

router = DefaultRouter()
router.register(r"", CentralWasteReportViewSet, basename="central-complaints")
router.register(r"comments", ReportCommentViewSet, basename="central-complaints-comments")

urlpatterns = router.urls
