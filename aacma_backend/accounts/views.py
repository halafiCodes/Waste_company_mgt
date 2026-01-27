from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from waste_collections.models import CollectionRequest
from waste_collections.serializers import CollectionRequestSerializer
from complaints.models import WasteReport
from companies.models import WasteCompany
from fleet.models import Vehicle
from audit.models import AuditLog
from .serializers import (
    RegisterSerializer,
    MeSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    RoleSerializer,
)
from .models import Role
from .permissions import IsAdmin, IsCentralAuthority

User = get_user_model()


def get_tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    """
    Public endpoint for resident registration.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(pk=response.data["id"])
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": MeSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """
    Simple login wrapper that returns JWT using username/password.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from django.contrib.auth import authenticate
        from django.contrib.auth import get_user_model

        username = request.data.get("username")
        password = request.data.get("password")
        # Allow login via email by resolving to username when an email is provided
        if username and "@" in username:
            User = get_user_model()
            # If multiple accounts share the same email, pick the first deterministically
            user_obj = (
                User.objects.filter(email__iexact=username)
                .order_by("id")
                .first()
            )
            if user_obj:
                username = user_obj.username
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tokens = get_tokens_for_user(user)
        return Response({"user": MeSerializer(user).data, "tokens": tokens})


class LogoutView(generics.GenericAPIView):
    """
    Blacklist refresh token (if using blacklist app); here we just accept.
    """

    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # In a real system, send email with token. Here we just echo success.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "If the email exists, a reset link was sent."})


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # In a real system, validate token. Here we just change password for demo.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        if not user:
            return Response(
                {"detail": "Authentication required to change password in demo mode."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password updated."})


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Central Authority admin user management.
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({"detail": "User suspended"})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({"detail": "User activated"})


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all().order_by("id")
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def central_dashboard(request):
    """
    Simple aggregated dashboard statistics for Central Authority.
    """
    data = {
        "users": User.objects.count(),
        "companies": WasteCompany.objects.count(),
        "vehicles": Vehicle.objects.count(),
        "collection_requests": CollectionRequest.objects.count(),
        "complaints": WasteReport.objects.count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def central_collections(request):
    """
    Monitor all collection requests.
    """
    qs = CollectionRequest.objects.select_related("resident").order_by("-created_at")[
        :200
    ]
    return Response(
        CollectionRequestSerializer(qs, many=True).data  # type: ignore[name-defined]
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def central_complaints(request):
    """
    View all complaints.
    """
    qs = WasteReport.objects.select_related("resident").order_by("-reported_at")[:200]
    from complaints.serializers import WasteReportSerializer  # local import

    return Response(WasteReportSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def system_health(request):
    """
    Basic system health check.
    """
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def system_metrics(request):
    """
    Placeholder for system metrics.
    """
    return Response(
        {
            "db": "ok",
            "cache": "n/a",
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsCentralAuthority])
def system_backup(request):
    """
    Placeholder for triggering system backup.
    """
    AuditLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action="backup",
        model_name="system",
        object_id="backup",
        changes={},
    )
    return Response({"detail": "Backup triggered"}, status=status.HTTP_202_ACCEPTED)


