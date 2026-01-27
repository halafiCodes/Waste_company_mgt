from django.db import models


class Notification(models.Model):
    """
    System notifications for all users.
    """

    NOTIFICATION_TYPES = [
        ("collection_scheduled", "Collection Scheduled"),
        ("collection_in_progress", "Collection In Progress"),
        ("collection_completed", "Collection Completed"),
        ("complaint_update", "Complaint Update"),
        ("system_alert", "System Alert"),
        ("company_approval", "Company Approval"),
        ("assignment", "New Assignment"),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} - {self.title}"

