from __future__ import annotations

import os
from datetime import datetime

from django.conf import settings
from django.db.models import Avg, Count, Sum, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth, Coalesce
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from audit.models import AuditLog
from complaints.models import WasteReport
from companies.models import WasteCompany
from fleet.models import Driver, Vehicle
from governance.models import ApprovalRequest
from routes.models import Route
from waste_collections.models import CollectionRequest, CollectionRecord
from .permissions import IsCentralAuthority, IsAnalytics
from django.contrib.auth import get_user_model

User = get_user_model()

START_TIME = timezone.now()


def _last_updated(model, field="updated_at"):
    latest = model.objects.order_by(f"-{field}").values_list(field, flat=True).first()
    if isinstance(latest, datetime):
        return latest.isoformat()
    return None


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def admin_system_data(request):
    data = [
        {
            "table": "users",
            "records": User.objects.count(),
            "last_updated": _last_updated(User, "date_joined"),
        },
        {
            "table": "companies",
            "records": WasteCompany.objects.count(),
            "last_updated": _last_updated(WasteCompany),
        },
        {
            "table": "vehicles",
            "records": Vehicle.objects.count(),
            "last_updated": _last_updated(Vehicle),
        },
        {
            "table": "drivers",
            "records": Driver.objects.count(),
            "last_updated": _last_updated(Driver),
        },
        {
            "table": "collection_requests",
            "records": CollectionRequest.objects.count(),
            "last_updated": _last_updated(CollectionRequest),
        },
        {
            "table": "complaints",
            "records": WasteReport.objects.count(),
            "last_updated": _last_updated(WasteReport, "reported_at"),
        },
        {
            "table": "routes",
            "records": Route.objects.count(),
            "last_updated": _last_updated(Route),
        },
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def supervisor_overview(request):
    pending_approvals = ApprovalRequest.objects.filter(status="pending").count()
    pending_companies = WasteCompany.objects.filter(status="pending").count()
    escalations = WasteReport.objects.filter(status__in=["escalated", "open"], priority__in=["high", "emergency"]).count()
    return Response(
        {
            "pending_approvals": pending_approvals,
            "pending_companies": pending_companies,
            "escalations": escalations,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def supervisor_requests(request):
    requests_payload = []
    for approval in ApprovalRequest.objects.filter(status="pending").select_related("requested_by")[:200]:
        requests_payload.append(
            {
                "id": f"APR-{approval.id}",
                "type": approval.request_type,
                "submitted_by": approval.requested_by.get_full_name() if approval.requested_by else "System",
                "priority": approval.metadata.get("priority", "normal") if approval.metadata else "normal",
                "date": approval.created_at.isoformat(),
                "status": approval.status,
            }
        )
    for company in WasteCompany.objects.filter(status="pending")[:200]:
        requests_payload.append(
            {
                "id": f"COM-{company.id}",
                "type": "Company Registration",
                "submitted_by": company.name,
                "priority": "normal",
                "date": company.registration_date.isoformat() if company.registration_date else None,
                "status": company.status,
            }
        )
    requests_payload.sort(key=lambda x: x.get("date") or "", reverse=True)
    return Response(requests_payload)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def supervisor_escalations(request):
    escalations = (
        WasteReport.objects.filter(status__in=["escalated", "open"], priority__in=["high", "emergency"]).select_related("resident")
    )
    data = [
        {
            "id": report.id,
            "issue": report.report_type,
            "from": report.resident.get_full_name() if report.resident else "Resident",
            "date": report.reported_at.isoformat(),
            "priority": report.priority,
            "status": report.status,
        }
        for report in escalations[:200]
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def it_status(request):
    db_name = settings.DATABASES.get("default", {}).get("NAME")
    db_size = os.path.getsize(db_name) if db_name and os.path.exists(db_name) else None
    latest_backup = (
        AuditLog.objects.filter(action="backup").order_by("-timestamp").values_list("timestamp", flat=True).first()
    )
    security_events = list(
        AuditLog.objects.filter(action__in=["login", "logout", "reject", "approve"]).order_by("-timestamp")[:10]
        .values("id", "action", "model_name", "timestamp", "ip_address", "user_id")
    )
    payload = {
        "uptime_seconds": (timezone.now() - START_TIME).total_seconds(),
        "db_size_bytes": db_size,
        "latest_backup": latest_backup.isoformat() if latest_backup else None,
        "security_events": security_events,
    }
    return Response(payload)


def _timedelta_to_hours(delta):
    if not delta:
        return 0.0
    return round(delta.total_seconds() / 3600, 2)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAnalytics])
def analytics_overview(request):
    total_requests = CollectionRequest.objects.count()
    completed_requests = CollectionRequest.objects.filter(status="completed").count()
    open_requests = CollectionRequest.objects.exclude(status__in=["completed", "cancelled"]).count()
    open_complaints = WasteReport.objects.exclude(status__in=["resolved", "closed"]).count()

    requests_by_month = (
        CollectionRequest.objects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    completed_by_month = (
        CollectionRequest.objects.filter(collected_at__isnull=False)
        .annotate(month=TruncMonth("collected_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    complaints_by_month = (
        WasteReport.objects.annotate(month=TruncMonth("reported_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    complaints_status_distribution = (
        WasteReport.objects.values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )
    status_distribution = (
        CollectionRequest.objects.values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )
    waste_type_distribution = (
        CollectionRequest.objects.values("waste_type")
        .annotate(total=Count("id"))
        .order_by("waste_type")
    )

    approvals_by_type = (
        ApprovalRequest.objects.values("request_type")
        .annotate(total=Count("id"))
        .order_by("request_type")
    )
    approvals_pending = ApprovalRequest.objects.filter(status="pending").count()

    route_status_distribution = (
        Route.objects.values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )
    vehicle_status_distribution = (
        Vehicle.objects.values("current_status")
        .annotate(total=Count("id"))
        .order_by("current_status")
    )

    volume_by_month = (
        CollectionRecord.objects.filter(collected_at__isnull=False)
        .annotate(month=TruncMonth("collected_at"))
        .values("month")
        .annotate(total_weight_kg=Coalesce(Sum("actual_weight_kg"), 0.0))
        .order_by("month")
    )

    completion_duration = ExpressionWrapper(
        F("collected_at") - F("created_at"), output_field=DurationField()
    )
    avg_completion = (
        CollectionRequest.objects.filter(status="completed", collected_at__isnull=False)
        .annotate(duration=completion_duration)
        .aggregate(avg_duration=Avg("duration"))
        .get("avg_duration")
    )

    company_performance = []
    company_requests = (
        CollectionRequest.objects.values("assigned_company__id", "assigned_company__name")
        .annotate(total_requests=Count("id"))
        .order_by("assigned_company__name")
    )
    company_completed = (
        CollectionRequest.objects.filter(status="completed")
        .values("assigned_company__id")
        .annotate(completed=Count("id"))
    )
    company_completed_map = {c["assigned_company__id"]: c["completed"] for c in company_completed}

    company_duration = (
        CollectionRequest.objects.filter(status="completed", collected_at__isnull=False)
        .annotate(duration=completion_duration)
        .values("assigned_company__id")
        .annotate(avg_duration=Avg("duration"))
    )
    company_duration_map = {
        c["assigned_company__id"]: _timedelta_to_hours(c["avg_duration"]) for c in company_duration
    }

    company_weight = (
        CollectionRecord.objects.values("collection_request__assigned_company__id")
        .annotate(total_weight_kg=Coalesce(Sum("actual_weight_kg"), 0.0))
    )
    company_weight_map = {
        c["collection_request__assigned_company__id"]: float(c["total_weight_kg"] or 0)
        for c in company_weight
    }

    for item in company_requests:
        company_id = item["assigned_company__id"]
        total = item["total_requests"]
        completed = company_completed_map.get(company_id, 0)
        company_performance.append(
            {
                "company_id": company_id,
                "company_name": item["assigned_company__name"] or "Unassigned",
                "total_requests": total,
                "completed_requests": completed,
                "completion_rate": round((completed / total) * 100, 2) if total else 0,
                "avg_completion_hours": company_duration_map.get(company_id, 0.0),
                "total_collected_weight_kg": company_weight_map.get(company_id, 0.0),
            }
        )

    zone_insights = []
    zone_requests = (
        CollectionRequest.objects.values("resident__zone__id", "resident__zone__name")
        .annotate(total_requests=Count("id"))
        .order_by("resident__zone__name")
    )
    zone_completed = (
        CollectionRequest.objects.filter(status="completed")
        .values("resident__zone__id")
        .annotate(completed=Count("id"))
    )
    zone_completed_map = {z["resident__zone__id"]: z["completed"] for z in zone_completed}
    zone_weight = (
        CollectionRecord.objects.values("collection_request__resident__zone__id")
        .annotate(total_weight_kg=Coalesce(Sum("actual_weight_kg"), 0.0))
    )
    zone_weight_map = {
        z["collection_request__resident__zone__id"]: float(z["total_weight_kg"] or 0)
        for z in zone_weight
    }
    for item in zone_requests:
        zone_id = item["resident__zone__id"]
        zone_insights.append(
            {
                "zone_id": zone_id,
                "zone_name": item["resident__zone__name"] or "Unassigned",
                "total_requests": item["total_requests"],
                "completed_requests": zone_completed_map.get(zone_id, 0),
                "total_collected_weight_kg": zone_weight_map.get(zone_id, 0.0),
            }
        )

    routes = Route.objects.select_related("assigned_vehicle").all()
    vehicle_utilization = {}
    route_utilization = []
    for route in routes:
        duration_hours = 0.0
        if route.actual_start_time and route.actual_end_time:
            duration_hours = _timedelta_to_hours(route.actual_end_time - route.actual_start_time)
        route_utilization.append(
            {
                "route_id": route.id,
                "route_name": route.name,
                "status": route.status,
                "vehicle_id": route.assigned_vehicle_id,
                "distance_km": float(route.total_distance_km or 0),
                "actual_start_time": route.actual_start_time.isoformat() if route.actual_start_time else None,
                "actual_end_time": route.actual_end_time.isoformat() if route.actual_end_time else None,
                "duration_hours": duration_hours,
            }
        )
        if route.assigned_vehicle_id:
            bucket = vehicle_utilization.setdefault(
                route.assigned_vehicle_id,
                {
                    "vehicle_id": route.assigned_vehicle_id,
                    "plate_number": route.assigned_vehicle.plate_number if route.assigned_vehicle else None,
                    "total_routes": 0,
                    "total_distance_km": 0.0,
                    "total_active_hours": 0.0,
                },
            )
            bucket["total_routes"] += 1
            bucket["total_distance_km"] += float(route.total_distance_km or 0)
            bucket["total_active_hours"] += duration_hours

    recent_requests = CollectionRequest.objects.select_related(
        "assigned_company", "resident__zone"
    ).order_by("-created_at")[:200]
    recent_records = CollectionRecord.objects.select_related(
        "collection_request", "vehicle", "driver"
    ).order_by("-created_at")[:200]

    recent_requests_payload = [
        {
            "request_id": req.id,
            "request_type": req.waste_type,
            "submitted_at": req.created_at.isoformat(),
            "assigned_company": req.assigned_company.name if req.assigned_company else None,
            "status": req.status,
            "status_updated_at": req.updated_at.isoformat() if req.updated_at else None,
            "completed_at": req.collected_at.isoformat() if req.collected_at else None,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "zone": req.resident.zone.name if req.resident and req.resident.zone else None,
        }
        for req in recent_requests
    ]

    recent_records_payload = [
        {
            "record_id": record.id,
            "request_id": record.collection_request_id,
            "truck_id": record.vehicle_id,
            "driver_id": record.driver_id,
            "collected_at": record.collected_at.isoformat(),
            "actual_weight_kg": record.actual_weight_kg,
        }
        for record in recent_records
    ]

    return Response(
        {
            "totals": {
                "collection_requests": total_requests,
                "completed_requests": completed_requests,
                "open_requests": open_requests,
                "open_complaints": open_complaints,
            },
            "collections_monthly": list(requests_by_month),
            "collections_completed_monthly": list(completed_by_month),
            "complaints_monthly": list(complaints_by_month),
            "complaints_status_distribution": list(complaints_status_distribution),
            "request_status_distribution": list(status_distribution),
            "waste_type_distribution": list(waste_type_distribution),
            "collection_volume_trends": list(volume_by_month),
            "average_completion_hours": _timedelta_to_hours(avg_completion),
            "company_performance": company_performance,
            "area_insights": zone_insights,
            "vehicle_utilization": list(vehicle_utilization.values()),
            "route_utilization": route_utilization,
            "route_status_distribution": list(route_status_distribution),
            "vehicle_status_distribution": list(vehicle_status_distribution),
            "approvals_pending": approvals_pending,
            "approvals_by_type": list(approvals_by_type),
            "recent_requests": recent_requests_payload,
            "recent_collection_records": recent_records_payload,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAnalytics])
def analytics_company_performance(request):
    data = analytics_overview(request).data.get("company_performance", [])
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAnalytics])
def analytics_area_insights(request):
    data = analytics_overview(request).data.get("area_insights", [])
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsAnalytics])
def analytics_vehicle_utilization(request):
    data = analytics_overview(request).data.get("vehicle_utilization", [])
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def audit_overview(request):
    total_logs = AuditLog.objects.count()
    latest_logs = AuditLog.objects.order_by("-timestamp")[:50]
    by_action = AuditLog.objects.values("action").annotate(total=Count("id")).order_by("action")
    return Response(
        {
            "total": total_logs,
            "by_action": list(by_action),
            "recent": AuditLogSerializer(latest_logs, many=True).data,
        }
    )


from audit.serializers import AuditLogSerializer  # noqa: E402  (placed after definition to avoid circular import)
