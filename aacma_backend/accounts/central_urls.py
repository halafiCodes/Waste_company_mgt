from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    central_dashboard,
    central_collections,
    central_complaints,
    system_health,
    system_metrics,
    system_backup,
)
from .role_views import (
    admin_system_data,
    supervisor_overview,
    supervisor_requests,
    supervisor_escalations,
    it_status,
    analytics_overview,
    analytics_company_performance,
    analytics_area_insights,
    analytics_vehicle_utilization,
    audit_overview,
)

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="central-users")

urlpatterns = [
    path("", include(router.urls)),
    path("zones/", include("zones.urls")),
    path("companies/", include("companies.central_urls")),
    path("complaints/", include("complaints.central_urls")),
    path("reports/", include("reports.urls")),
    path("audit/", include("audit.urls")),
    path("governance/", include("governance.urls")),
    path("dashboard/", central_dashboard, name="central-dashboard"),
    path("collections/", central_collections, name="central-collections"),
    path("complaints/list/", central_complaints, name="central-complaints-list"),
    path("system/health/", system_health, name="central-system-health"),
    path("system/metrics/", system_metrics, name="central-system-metrics"),
    path("system/backup/", system_backup, name="central-system-backup"),
    # Role-specific endpoints
    path("role/admin/system-data/", admin_system_data, name="role-admin-system-data"),
    path("role/supervisor/overview/", supervisor_overview, name="role-supervisor-overview"),
    path("role/supervisor/requests/", supervisor_requests, name="role-supervisor-requests"),
    path("role/supervisor/escalations/", supervisor_escalations, name="role-supervisor-escalations"),
    path("role/it/status/", it_status, name="role-it-status"),
    path("role/analytics/overview/", analytics_overview, name="role-analytics-overview"),
    path("role/analytics/company-performance/", analytics_company_performance, name="role-analytics-company-performance"),
    path("role/analytics/area-insights/", analytics_area_insights, name="role-analytics-area-insights"),
    path("role/analytics/vehicle-utilization/", analytics_vehicle_utilization, name="role-analytics-vehicle-utilization"),
    path("role/audit/overview/", audit_overview, name="role-audit-overview"),
]



