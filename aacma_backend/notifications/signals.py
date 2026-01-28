from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Notification
from waste_collections.models import CollectionRequest
from complaints.models import WasteReport

User = get_user_model()


def _notify_waste_companies(notification_type: str, title: str, message: str, data: dict) -> None:
    company_users = User.objects.filter(user_type="waste_company", is_active=True)
    notifications = [
        Notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
        )
        for user in company_users
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


@receiver(post_save, sender=CollectionRequest)
def collection_request_notification(sender, instance: CollectionRequest, created, **kwargs):
    """
    Notify resident when their request is created or completed.
    """
    if created:
        Notification.objects.create(
            user=instance.resident,
            notification_type="collection_scheduled",
            title="Collection request created",
            message=f"Your collection request #{instance.id} has been created.",
            data={"request_id": instance.id},
        )
        _notify_waste_companies(
            notification_type="assignment",
            title="New collection request",
            message=f"New resident request #{instance.id} requires assignment.",
            data={"request_id": instance.id, "waste_type": instance.waste_type},
        )
    elif instance.status == "completed":
        Notification.objects.create(
            user=instance.resident,
            notification_type="collection_completed",
            title="Collection completed",
            message=f"Your collection request #{instance.id} has been completed.",
            data={"request_id": instance.id},
        )


@receiver(post_save, sender=WasteReport)
def waste_report_notification(sender, instance: WasteReport, created, **kwargs):
    """
    Notify resident on complaint updates.
    """
    if created:
        Notification.objects.create(
            user=instance.resident,
            notification_type="complaint_update",
            title="Complaint submitted",
            message=f"Your complaint #{instance.id} has been submitted.",
            data={"report_id": instance.id},
        )
        _notify_waste_companies(
            notification_type="complaint_update",
            title="New resident complaint",
            message=f"Resident complaint #{instance.id} has been submitted.",
            data={"report_id": instance.id, "report_type": instance.report_type},
        )
    else:
        Notification.objects.create(
            user=instance.resident,
            notification_type="complaint_update",
            title="Complaint updated",
            message=f"Your complaint #{instance.id} status is now {instance.status}.",
            data={"report_id": instance.id, "status": instance.status},
        )

