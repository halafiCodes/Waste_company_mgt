from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response

from accounts.permissions import IsDriver
from .models import Driver, Vehicle
from routes.models import Route, RouteStop
from routes.serializers import RouteSerializer, RouteStopSerializer


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_profile(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    from .serializers import DriverSerializer

    return Response(DriverSerializer(driver).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_assignments(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    today = timezone.now().date()
    routes = Route.objects.filter(
        assigned_driver=driver, scheduled_date=today
    ).order_by("scheduled_start_time")
    return Response(RouteSerializer(routes, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_current_route(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    route = (
        Route.objects.filter(
            assigned_driver=driver, status__in=["scheduled", "in_progress"]
        )
        .order_by("scheduled_date")
        .first()
    )
    if not route:
        return Response(
            {"detail": "No current route"}, status=status.HTTP_404_NOT_FOUND
        )
    return Response(RouteSerializer(route).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_start_route(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    route = (
        Route.objects.filter(assigned_driver=driver, status="scheduled")
        .order_by("scheduled_date")
        .first()
    )
    if not route:
        return Response(
            {"detail": "No scheduled route"}, status=status.HTTP_404_NOT_FOUND
        )
    route.status = "in_progress"
    route.actual_start_time = timezone.now()
    route.save()
    return Response(RouteSerializer(route).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_stop_arrive(request, pk: int):
    stop = RouteStop.objects.get(pk=pk)
    stop.status = "in_progress"
    stop.arrival_time = timezone.now()
    stop.save()
    return Response(RouteStopSerializer(stop).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_stop_complete(request, pk: int):
    stop = RouteStop.objects.get(pk=pk)
    stop.status = "completed"
    stop.departure_time = timezone.now()
    stop.save()
    return Response(RouteStopSerializer(stop).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_complete_route(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    route = (
        Route.objects.filter(assigned_driver=driver, status="in_progress")
        .order_by("scheduled_date")
        .first()
    )
    if not route:
        return Response(
            {"detail": "No in-progress route"}, status=status.HTTP_404_NOT_FOUND
        )
    route.status = "completed"
    route.actual_end_time = timezone.now()
    route.save()
    return Response(RouteSerializer(route).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_update_location(request):
    driver: Driver = request.user.driver_profile  # type: ignore[assignment]
    vehicle = driver.assigned_vehicle
    if not vehicle:
        return Response(
            {"detail": "No assigned vehicle"}, status=status.HTTP_400_BAD_REQUEST
        )
    vehicle.last_location_lat = request.data.get("lat")
    vehicle.last_location_lng = request.data.get("lng")
    vehicle.last_location_update = timezone.now()
    vehicle.save()
    return Response({"detail": "Location updated"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsDriver])
def driver_report_issue(request):
    """
    Minimal placeholder for driver issue reporting.
    """
    description = request.data.get("description", "")
    return Response(
        {"detail": "Issue received", "description": description},
        status=status.HTTP_201_CREATED,
    )

