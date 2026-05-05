from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Hostel, HostelImage, Room, Review
from .serializers import (
    HostelSerializer, HostelListSerializer, RoomSerializer,
    ReviewSerializer, ReviewCreateSerializer, HostelImageSerializer
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

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """Get all rooms for a specific hostel"""
        hostel = self.get_object()
        rooms = hostel.rooms.filter(is_available=True)
        serializer = RoomSerializer(rooms, many=True)
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
        serializer = HostelImageSerializer(images, many=True)
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

    @action(detail=False, methods=['get'])
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
