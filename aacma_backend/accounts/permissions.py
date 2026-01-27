from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCentralAuthority(BasePermission):
    """User must be Central Authority staff."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.user_type == "central_authority"
        )


class IsDirectorate(BasePermission):
    """User must have Directorate role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "directorate"
        )


class IsSupervisor(BasePermission):
    """User must have Supervisor role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "supervisor"
        )


class IsAdmin(BasePermission):
    """User must have Admin role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "admin"
        )


class IsAudit(BasePermission):
    """User must have Audit role - Read Only access."""

    def has_permission(self, request, view):
        user = request.user
        if (
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "audit"
        ):
            return request.method in SAFE_METHODS
        return False


class IsIT(BasePermission):
    """User must have Technical/IT role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "it"
        )


class IsAnalytics(BasePermission):
    """User must have Data & Analytics role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            and user.role.slug == "analytics"
        )


class IsWasteCompany(BasePermission):
    """User must belong to a Waste Company."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.user_type == "waste_company"
        )


class IsResident(BasePermission):
    """User must be a Resident."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.user_type == "resident"
        )


class IsDriver(BasePermission):
    """User must be a Driver."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and hasattr(user, "driver_profile")
        )

