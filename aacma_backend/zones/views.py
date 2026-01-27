from rest_framework import viewsets, permissions

from .models import Zone
from .serializers import ZoneSerializer
from accounts.permissions import IsDirectorate


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsDirectorate]

