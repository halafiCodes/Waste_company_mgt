from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer
from accounts.permissions import IsWasteCompany, IsDriver


class CompanyRouteViewSet(viewsets.ModelViewSet):
    """
    Company route management.
    """

    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def get_queryset(self):
        return Route.objects.all()

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        route = self.get_object()
        route.status = "in_progress"
        route.actual_start_time = timezone.now()
        route.save()
        return Response(self.get_serializer(route).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        route = self.get_object()
        route.status = "completed"
        route.actual_end_time = timezone.now()
        route.save()
        return Response(self.get_serializer(route).data)

    @action(detail=True, methods=["get"], url_path="stops")
    def stops(self, request, pk=None):
        route = self.get_object()
        serializer = RouteStopSerializer(route.stops.all(), many=True)
        return Response(serializer.data)


class CompanyRouteStopUpdateViewSet(viewsets.GenericViewSet):
    """
    For updating individual route stops.
    """

    queryset = RouteStop.objects.all()
    serializer_class = RouteStopSerializer
    permission_classes = [permissions.IsAuthenticated, IsWasteCompany]

    def update(self, request, route_pk=None, pk=None):
        stop = self.get_object()
        serializer = self.get_serializer(stop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DriverRouteViewSet(viewsets.ViewSet):
    """
    Driver mobile route interaction API.
    """

    permission_classes = [permissions.IsAuthenticated, IsDriver]

    def list(self, request):
        driver = request.user.driver_profile
        route = (
            Route.objects.filter(assigned_driver=driver, status__in=["scheduled", "in_progress"])
            .order_by("scheduled_date")
            .first()
        )
        if not route:
            return Response({"detail": "No current route"}, status=status.HTTP_404_NOT_FOUND)
        return Response(RouteSerializer(route).data)

    @action(detail=False, methods=["post"])
    def start(self, request):
        driver = request.user.driver_profile
        route = (
            Route.objects.filter(assigned_driver=driver, status="scheduled")
            .order_by("scheduled_date")
            .first()
        )
        if not route:
            return Response({"detail": "No scheduled route"}, status=status.HTTP_404_NOT_FOUND)
        route.status = "in_progress"
        route.actual_start_time = timezone.now()
        route.save()
        return Response(RouteSerializer(route).data)

    @action(detail=False, methods=["post"], url_path="stop/(?P<pk>[^/.]+)/arrive")
    def stop_arrive(self, request, pk=None):
        stop = RouteStop.objects.get(pk=pk)
        stop.status = "in_progress"
        stop.arrival_time = timezone.now()
        stop.save()
        return Response(RouteStopSerializer(stop).data)

    @action(detail=False, methods=["post"], url_path="stop/(?P<pk>[^/.]+)/complete")
    def stop_complete(self, request, pk=None):
        stop = RouteStop.objects.get(pk=pk)
        stop.status = "completed"
        stop.departure_time = timezone.now()
        stop.save()
        return Response(RouteStopSerializer(stop).data)

    @action(detail=False, methods=["post"])
    def complete(self, request):
        driver = request.user.driver_profile
        route = (
            Route.objects.filter(assigned_driver=driver, status="in_progress")
            .order_by("scheduled_date")
            .first()
        )
        if not route:
            return Response({"detail": "No in-progress route"}, status=status.HTTP_404_NOT_FOUND)
        route.status = "completed"
        route.actual_end_time = timezone.now()
        route.save()
        return Response(RouteSerializer(route).data)

