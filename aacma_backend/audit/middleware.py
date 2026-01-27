from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin
from django.db import connection

from .models import AuditLog


class AuditLogMiddleware(MiddlewareMixin):
    """
    Simple audit logging middleware.

    Logs each API request with minimal information. For write operations,
    viewsets and signals can enrich the `changes` field explicitly.
    """

    def process_response(self, request, response):
        # Only log API calls
        if request.path.startswith("/api/"):
            user = getattr(request, "user", None)
            action = self._guess_action(request.method)

            AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                action=action,
                model_name="HTTP",
                object_id=request.path,
                changes={
                    "method": request.method,
                    "status_code": response.status_code,
                    "query_params": request.GET.dict(),
                },
                ip_address=self._get_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            )

        # Ensure DB connection isn't left open by logging
        connection.close()
        return response

    @staticmethod
    def _guess_action(method: str) -> str:
        if method in ("POST", "PUT", "PATCH"):
            return "update"
        if method == "DELETE":
            return "delete"
        return "create"

    @staticmethod
    def _get_ip(request) -> str | None:
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

