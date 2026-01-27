from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class UserNotificationViewSet(viewsets.ModelViewSet):
    """
    User notifications (resident/company/driver/etc).
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["put"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        qs = self.get_queryset().filter(is_read=False)
        now = timezone.now()
        qs.update(is_read=True, read_at=now)
        return Response(status=status.HTTP_204_NO_CONTENT)

