from __future__ import annotations

import os
from datetime import datetime

from django.conf import settings
from django.db.models import Count
from django.db.models.functions import TruncMonth
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
from waste_collections.models import CollectionRequest
from .permissions import IsCentralAuthority
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


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def analytics_overview(request):
    total_requests = CollectionRequest.objects.count()
    completed_requests = CollectionRequest.objects.filter(status="completed").count()
    open_complaints = WasteReport.objects.exclude(status__in=["resolved", "closed"]).count()

    by_month = (
        CollectionRequest.objects.annotate(month=TruncMonth("created_at"))
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
    waste_type_distribution = (
        CollectionRequest.objects.values("waste_type").annotate(total=Count("id")).order_by("waste_type")
    )

    return Response(
        {
            "totals": {
                "collection_requests": total_requests,
                "completed_requests": completed_requests,
                "open_complaints": open_complaints,
            },
            "collections_monthly": list(by_month),
            "complaints_monthly": list(complaints_by_month),
            "waste_type_distribution": list(waste_type_distribution),
        }
    )


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
