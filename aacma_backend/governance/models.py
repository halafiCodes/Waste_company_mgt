from django.conf import settings
from django.db import models
from django.utils import timezone


class Policy(models.Model):
    """System-wide policies and rules created by central authority."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("under_review", "Under Review"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default="General")
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    effective_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="policies_created",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - convenience
        return self.title

    def publish(self):
        self.status = "active"
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])


class ApprovalRequest(models.Model):
    """Generic approval workflow items for central authority."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.AutoField(primary_key=True)
    request_type = models.CharField(max_length=100)
    item_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approvals_requested",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approvals_decided",
    )
    decision_notes = models.TextField(blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    policy = models.ForeignKey(
        Policy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - convenience
        return f"{self.request_type}: {self.item_name}"

    def approve(self, approver, notes: str | None = None):
        if self.status != "pending":
            return
        self.status = "approved"
        self.approver = approver
        self.decision_notes = notes or ""
        self.decided_at = timezone.now()
        self.save(update_fields=[
            "status",
            "approver",
            "decision_notes",
            "decided_at",
            "updated_at",
        ])

    def reject(self, approver, notes: str | None = None):
        if self.status != "pending":
            return
        self.status = "rejected"
        self.approver = approver
        self.decision_notes = notes or ""
        self.decided_at = timezone.now()
        self.save(update_fields=[
            "status",
            "approver",
            "decision_notes",
            "decided_at",
            "updated_at",
        ])
