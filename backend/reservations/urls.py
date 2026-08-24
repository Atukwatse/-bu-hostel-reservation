from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ReservationViewSet, InquiryViewSet, WaitingListViewSet

router = SimpleRouter()
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'inquiries', InquiryViewSet, basename='inquiry')
router.register(r'waiting-list', WaitingListViewSet, basename='waiting-list')

urlpatterns = [
    path('', include(router.urls)),
]
