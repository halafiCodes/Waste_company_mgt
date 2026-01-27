from __future__ import annotations

from django.db import models
from django.contrib.auth.models import AbstractUser


class Role(models.Model):
    """
    System roles for all user types.
    """

    ROLE_CHOICES = [
        # Central Authority internal roles
        ("directorate", "Directorate"),
        ("supervisor", "Supervisory Authority"),
        ("admin", "System Administrator"),
        ("it", "Technical/IT Authority"),
        ("audit", "Audit & Compliance Authority"),
        ("analytics", "Data & Analytics Authority"),
        # External roles
        ("company_manager", "Waste Company Manager"),
        ("driver", "Driver"),
        ("resident", "Resident"),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    level = models.CharField(max_length=50)  # e.g., "Strategic", "Operational"
    authority_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)  # List of permission strings
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """
    Custom User model supporting all user types.
    """

    USER_TYPE_CHOICES = [
        ("central_authority", "Central Authority"),
        ("waste_company", "Waste Company"),
        ("resident", "Resident"),
    ]

    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    zone = models.ForeignKey(
        "zones.Zone", on_delete=models.SET_NULL, null=True, blank=True
    )
    is_verified = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.get_full_name() or self.username

