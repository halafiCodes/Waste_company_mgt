from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification
from waste_collections.models import CollectionRequest
from complaints.models import WasteReport


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
    else:
        Notification.objects.create(
            user=instance.resident,
            notification_type="complaint_update",
            title="Complaint updated",
            message=f"Your complaint #{instance.id} status is now {instance.status}.",
            data={"report_id": instance.id, "status": instance.status},
        )

