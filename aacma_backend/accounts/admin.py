from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Role, User


class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {"fields": ("first_name", "last_name", "email", "phone", "address", "zone", "profile_image")},
        ),
        (
            _("Role & Type"),
            {"fields": ("user_type", "role", "is_verified")},
        ),
        (
            _("Permissions"),
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "user_type",
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )
    list_display = ("username", "email", "user_type", "role", "is_active", "is_staff")
    list_filter = ("user_type", "role__slug", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)


admin.site.register(User, UserAdmin)
admin.site.register(Role)
