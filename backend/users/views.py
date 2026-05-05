from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db import models
from .models import User, UserProfile, LoginActivity
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    UserUpdateSerializer, PasswordChangeSerializer, LoginActivitySerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'put', 'patch'])
    def profile(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def login_history(self, request):
        """Get user login history"""
        login_activities = request.user.login_activities.all()[:20]  # Last 20 logins
        serializer = LoginActivitySerializer(login_activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Logout user and invalidate token"""
        try:
            # Delete the user's token
            token = Token.objects.get(user=request.user)
            token.delete()
            
            # Record logout activity
            login_activity = LoginActivity.objects.filter(
                user=request.user,
                logout_time__isnull=True
            ).first()
            if login_activity:
                login_activity.logout_time = timezone.now()
                login_activity.save()
            
            logout(request)
            return Response({'message': 'Logged out successfully'})
        except Token.DoesNotExist:
            return Response({'message': 'Logged out successfully'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        user = request.user
        data = {
            'total_reservations': user.reservations.count(),
            'active_reservations': user.reservations.filter(
                status__in=['pending', 'confirmed']
            ).count(),
            'completed_reservations': user.reservations.filter(status='completed').count(),
            'total_reviews': user.hostel_reviews.count(),
            'waiting_list_entries': user.waiting_list_entries.filter(is_active=True).count(),
            'join_date': user.date_joined,
            'last_login': user.last_login,
        }
        return Response(data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Custom login view"""
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        # Record login activity
        LoginActivity.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            is_successful=True
        )
        
        # Update user's last login
        user.last_login = timezone.now()
        user.save()
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        })
    
    # Record failed login attempt
    name = request.data.get('name', '')
    
    try:
        # Try to find user by name for failed login tracking
        user = User.objects.filter(
            models.Q(first_name__icontains=name.split()[0]) & 
            models.Q(last_name__icontains=' '.join(name.split()[1:]) if len(name.split()) > 1 else models.Q(last_name__icontains=''))
        ).first()
        
        if not user:
            user = User.objects.filter(username__icontains=name).first()
        
        if user:
            LoginActivity.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                is_successful=False
            )
    except:
        pass
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Custom logout view"""
    try:
        # Delete the user's token
        token = Token.objects.get(user=request.user)
        token.delete()
        
        # Record logout activity
        login_activity = LoginActivity.objects.filter(
            user=request.user,
            logout_time__isnull=True
        ).first()
        if login_activity:
            login_activity.logout_time = timezone.now()
            login_activity.save()
        
        logout(request)
        return Response({'message': 'Logged out successfully'})
    except Token.DoesNotExist:
        return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """User registration view"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create token for new user
        token, created = Token.objects.get_or_create(user=user)
        
        # Record login activity
        LoginActivity.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            is_successful=True
        )
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
