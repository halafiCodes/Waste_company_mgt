from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    RoleViewSet,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("password/reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-confirm"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("roles/", RoleViewSet.as_view({"get": "list"}), name="auth-roles"),
]

