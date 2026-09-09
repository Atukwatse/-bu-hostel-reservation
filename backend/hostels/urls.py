from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import HostelViewSet, RoomViewSet, ReviewViewSet, HostelImageViewSet, HostelSubscriptionViewSet

router = SimpleRouter()
router.register(r'hostels', HostelViewSet, basename='hostel')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'images', HostelImageViewSet, basename='hostel-image')
router.register(r'subscriptions', HostelSubscriptionViewSet, basename='hostel-subscription')

urlpatterns = [
    path('', include(router.urls)),
]
