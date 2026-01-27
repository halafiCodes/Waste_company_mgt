from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ResidentCollectionRequestViewSet, CompanyCollectionRequestViewSet

resident_router = DefaultRouter()
resident_router.register(r"resident/requests", ResidentCollectionRequestViewSet, basename="resident-requests")

company_router = DefaultRouter()
company_router.register(r"company/requests", CompanyCollectionRequestViewSet, basename="company-requests")

urlpatterns = [
    path("", include(resident_router.urls)),
    path("", include(company_router.urls)),
]

