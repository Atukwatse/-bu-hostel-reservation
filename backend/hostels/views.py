from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Hostel, HostelImage, Room, Review, HostelSubscription, expired_grace_hostels
from .serializers import (
    HostelSerializer, HostelListSerializer, RoomSerializer,
    ReviewSerializer, ReviewCreateSerializer, HostelImageSerializer,
    HostelSubscriptionSerializer, HostelSubscriptionCreateSerializer,
    HostelOnboardSerializer
)


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'gender', 'rooms_status']
    search_fields = ['name', 'location', 'description', 'facilities']
    ordering_fields = ['name', 'rating', 'price', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return HostelListSerializer
        return HostelSerializer

    def get_queryset(self):
        """Return the hostels visible to the current user.

        Caretaker hostels are shown on the site immediately (even before they
        pay) and are given a 4-day grace period to pay the subscription fee.
        Hostels whose grace period has lapsed unpaid are removed from the site
        (excluded from every listing below). Admins see all hostels.
        """
        qs = Hostel.objects.all()
        expired_ids = expired_grace_hostels().values('id')
        qs = qs.exclude(id__in=expired_ids)

        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            if user.role == 'admin':
                return qs
            if user.role == 'caretaker':
                return qs.filter(
                    Q(is_listed=True) | Q(admin_user=user)
                )
        return qs.filter(is_listed=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'onboard']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def _has_active_subscription(self, user):
        """A caretaker needs an active paid subscription to list a hostel."""
        if user.role != 'caretaker':
            return True
        from django.utils import timezone
        today = timezone.localdate()
        return user.hostel_subscriptions.filter(
            status='active',
            start_date__lte=today,
            end_date__gte=today,
        ).exists()

    def perform_create(self, serializer):
        """Gate hostel creation: caretakers must hold an active paid subscription.

        Admins (Dean of Students) can create hostels freely. A caretaker who
        self-registers must first pay the subscription fee before they can add
        their hostel to our site.
        """
        user = self.request.user
        if user.role == 'caretaker' and not self._has_active_subscription(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                'You need an active subscription to list a hostel on our site. '
                'Please subscribe first so you can add and start monitoring your hostel.'
            )
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_hostel(self, request):
        """Return the access scope for the logged-in user.

        - Admin (dean of students): sees everything, is never scoped.
        - Caretaker with a linked hostel: returns that single hostel.
        - Caretaker without a hostel: returns the hostel list for selection.
        """
        user = request.user
        if user.role == 'admin':
            hostels = self.get_queryset()
            serializer = HostelListSerializer(hostels, many=True, context={'request': request})
            return Response({'is_admin': True, 'hostel': None, 'single': False, 'hostels': serializer.data})
        hostel = getattr(user, 'managed_hostel', None)
        if hostel is not None:
            serializer = HostelSerializer(hostel, context={'request': request})
            return Response({'is_admin': False, 'hostel': serializer.data, 'single': True})
        hostels = self.get_queryset()
        serializer = HostelListSerializer(hostels, many=True, context={'request': request})
        return Response({'is_admin': False, 'hostel': None, 'single': False, 'hostels': serializer.data})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def onboard(self, request):
        """Single-step caretaker onboarding: account + hostel draft + pending subscription.

        A caretaker who is not yet signed up fills one form (account details,
        hostel details and subscription payment info) and submits it once. This
        creates their account, saves their hostel as a draft (hidden from the
        public), and records a pending subscription. Once the admin activates
        the subscription, the hostel is published automatically.
        """
        serializer = HostelOnboardSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            result = serializer.save()
            return Response(
                {
                    'message': (
                        'Your account, hostel and subscription request were submitted. '
                        'The system admin will verify your payment and publish your hostel.'
                    ),
                    **result,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def select_admin(self, request, pk=None):
        """Link the logged-in caretaker to this hostel (caretaker self-assignment)."""
        user = request.user
        if user.role != 'caretaker':
            return Response(
                {'error': 'Only caretakers can select a hostel to manage'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Remove the user from any other hostel first (OneToOne)
        Hostel.objects.filter(admin_user=user).update(admin_user=None)

        hostel = self.get_object()
        hostel.admin_user = user
        hostel.save(update_fields=['admin_user'])
        return Response({'message': 'Hostel assigned successfully', 'hostel': HostelSerializer(hostel, context={'request': request}).data})

    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """Get all rooms for a specific hostel"""
        hostel = self.get_object()
        rooms = hostel.rooms.filter(is_available=True)
        serializer = RoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get all reviews for a specific hostel"""
        hostel = self.get_object()
        reviews = hostel.hostel_reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        """Add a review to a specific hostel"""
        hostel = self.get_object()
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            review = serializer.save(hostel=hostel)
            
            # Update hostel rating
            avg_rating = hostel.hostel_reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
            hostel.rating = round(avg_rating, 1)
            hostel.reviews = hostel.hostel_reviews.count()
            hostel.save()
            
            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """Get all images for a specific hostel"""
        hostel = self.get_object()
        images = hostel.images.all()
        serializer = HostelImageSerializer(images, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get only available hostels"""
        hostels = self.get_queryset().filter(rooms_status='Available')
        page = self.paginate_queryset(hostels)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(hostels, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Filter hostels by type (university/private)"""
        hostel_type = request.query_params.get('type')
        if hostel_type:
            hostels = self.get_queryset().filter(type=hostel_type)
        else:
            return Response(
                {'error': 'Type parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        page = self.paginate_queryset(hostels)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(hostels, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_subscription(self, request):
        """Return whether the logged-in caretaker has an active account subscription."""
        user = request.user
        if user.role != 'caretaker':
            return Response({'active': False, 'subscription': None})
        from django.utils import timezone
        today = timezone.localdate()
        sub = user.hostel_subscriptions.filter(
            status='active', start_date__lte=today, end_date__gte=today
        ).first()
        if sub is not None:
            return Response({'active': True, 'subscription': HostelSubscriptionSerializer(sub).data})
        return Response({'active': False, 'subscription': None})

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def search(self, request):
        """Advanced search for hostels"""
        query = request.query_params.get('q', '')
        min_rating = request.query_params.get('min_rating')
        max_price = request.query_params.get('max_price')
        gender = request.query_params.get('gender')
        
        hostels = self.get_queryset()
        
        if query:
            hostels = hostels.filter(
                Q(name__icontains=query) |
                Q(location__icontains=query) |
                Q(description__icontains=query) |
                Q(facilities__icontains=query)
            )
        
        if min_rating:
            hostels = hostels.filter(rating__gte=min_rating)
        
        if max_price:
            # This is a simple price filter - you might want to make it more sophisticated
            hostels = hostels.filter(price__icontains=max_price)
        
        if gender:
            hostels = hostels.filter(gender=gender)
        
        page = self.paginate_queryset(hostels)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(hostels, many=True)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hostel', 'room_type', 'is_available']
    search_fields = ['room_number', 'hostel__name', 'facilities']
    ordering_fields = ['room_number', 'price_per_semester', 'capacity']
    ordering = ['room_number']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def hostel_info(self, request, pk=None):
        """Get hostel information for a specific room"""
        room = self.get_object()
        hostel = room.hostel
        serializer = HostelListSerializer(hostel)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['hostel', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        hostel = serializer.validated_data['hostel']
        serializer.save(user=self.request.user)
        
        # Update hostel rating
        avg_rating = hostel.hostel_reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        hostel.rating = round(avg_rating, 1) if avg_rating else 0
        hostel.reviews = hostel.hostel_reviews.count()
        hostel.save()


class HostelImageViewSet(viewsets.ModelViewSet):
    queryset = HostelImage.objects.all()
    serializer_class = HostelImageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        hostel_id = self.request.data.get('hostel')
        hostel = Hostel.objects.get(id=hostel_id)
        serializer.save()


class HostelSubscriptionViewSet(viewsets.ModelViewSet):
    """Manage caretaker subscriptions to list hostels on the site.

    Caretakers create a subscription (paying the admin the subscription fee)
    to unlock the ability to add and monitor a hostel. Admins can see and
    manage all subscriptions.
    """
    queryset = HostelSubscription.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'hostel']
    search_fields = ['caretaker__username', 'caretaker__email', 'hostel__name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'amount_paid']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return HostelSubscriptionCreateSerializer
        return HostelSubscriptionSerializer

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return HostelSubscription.objects.all()
        return HostelSubscription.objects.filter(caretaker=self.request.user)

    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        """Get the current caretaker's active subscription."""
        from django.utils import timezone
        today = timezone.localdate()
        sub = HostelSubscription.objects.filter(
            caretaker=request.user,
            status='active',
            start_date__lte=today,
            end_date__gte=today,
        ).first()
        serializer = HostelSubscriptionSerializer(sub) if sub else None
        return Response({
            'active': sub is not None,
            'subscription': serializer.data if serializer else None
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def activate(self, request, pk=None):
        """Admin-only: activate/approve a pending subscription."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can activate subscriptions'},
                status=status.HTTP_403_FORBIDDEN
            )
        subscription = self.get_object()
        subscription.status = 'active'
        subscription.save()
        # If this subscription was created via single-step onboarding, it owns a
        # draft hostel - publish it now that the payment is verified.
        if subscription.hostel_id and not subscription.hostel.is_listed:
            subscription.hostel.is_listed = True
            subscription.hostel.save(update_fields=['is_listed'])
        return Response({'message': 'Subscription activated successfully'})
