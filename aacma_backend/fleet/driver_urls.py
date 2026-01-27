from django.urls import path

from .driver_views import (
    driver_profile,
    driver_assignments,
    driver_current_route,
    driver_start_route,
    driver_stop_arrive,
    driver_stop_complete,
    driver_complete_route,
    driver_update_location,
    driver_report_issue,
)

urlpatterns = [
    path("profile/", driver_profile, name="driver-profile"),
    path("assignments/", driver_assignments, name="driver-assignments"),
    path("route/", driver_current_route, name="driver-route"),
    path("route/start/", driver_start_route, name="driver-route-start"),
    path("route/stop/<int:pk>/arrive/", driver_stop_arrive, name="driver-route-stop-arrive"),
    path("route/stop/<int:pk>/complete/", driver_stop_complete, name="driver-route-stop-complete"),
    path("route/complete/", driver_complete_route, name="driver-route-complete"),
    path("location/", driver_update_location, name="driver-location"),
    path("report-issue/", driver_report_issue, name="driver-report-issue"),
]

