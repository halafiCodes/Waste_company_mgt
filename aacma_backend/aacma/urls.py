from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="AACMA Waste & Recycling Management API",
        default_version="v1",
        description="API documentation for the Addis Ababa Cleansing Management Agency platform.",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth JWT endpoints (used by account views as helpers)
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App routers
    path("api/auth/", include("accounts.urls")),
    path("api/central/", include("accounts.central_urls")),
    path("api/zones/", include("zones.urls")),
    path("api/company/", include("companies.urls")),
    path("api/fleet/", include("fleet.urls")),
    path("api/driver/", include("fleet.driver_urls")),
    path("api/routes/", include("routes.urls")),
    path("api/collections/", include("waste_collections.urls")),
    path("api/complaints/", include("complaints.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/audit/", include("audit.urls")),
    # Swagger / Redoc docs
    path(
        "api/docs/swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "api/docs/redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

