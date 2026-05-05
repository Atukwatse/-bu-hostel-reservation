from django.urls import path
from .views import login_view, logout_view, current_user, register_view

urlpatterns = [
    path('login/', login_view, name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('register/', register_view, name='auth-register'),
    path('me/', current_user, name='auth-current-user'),
]
