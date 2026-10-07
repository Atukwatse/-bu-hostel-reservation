from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import UserViewSet, NotificationViewSet

router = SimpleRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
