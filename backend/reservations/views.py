from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Reservation, Payment, Inquiry, WaitingList
from .serializers import (
    ReservationSerializer, ReservationCreateSerializer, PaymentSerializer,
    InquirySerializer, InquiryCreateSerializer, WaitingListSerializer
)


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'payment_method', 'semester', 'academic_year']
    search_fields = ['reservation_code', 'hostel__name', 'user__username', 'user__email']
    ordering_fields = ['created_at', 'check_in_date', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Reservation.objects.all()
        else:
            return Reservation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        """Get current user's reservations"""
        reservations = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(reservations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a reservation (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can confirm reservations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reservation = self.get_object()
        if reservation.status != 'pending':
            return Response(
                {'error': 'Only pending reservations can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'confirmed'
        reservation.confirmed_at = timezone.now()
        reservation.save()
        
        # Update room occupancy if room is assigned
        if reservation.room:
            reservation.room.current_occupancy += 1
            reservation.room.save()
        
        return Response({'message': 'Reservation confirmed successfully'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()
        
        # Check if user can cancel this reservation
        if request.user.role != 'admin' and reservation.user != request.user:
            return Response(
                {'error': 'You can only cancel your own reservations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'Cannot cancel a completed or already cancelled reservation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'cancelled'
        reservation.cancelled_at = timezone.now()
        reservation.save()
        
        # Update room occupancy if room was assigned and reservation was confirmed
        if reservation.room and reservation.status == 'confirmed':
            reservation.room.current_occupancy = max(0, reservation.room.current_occupancy - 1)
            reservation.room.save()
        
        return Response({'message': 'Reservation cancelled successfully'})

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get all payments for a reservation"""
        reservation = self.get_object()
        payments = reservation.payments.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a reservation"""
        reservation = self.get_object()
        
        # Check if user can add payment to this reservation
        if request.user.role != 'admin' and reservation.user != request.user:
            return Response(
                {'error': 'You can only add payments to your own reservations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PaymentSerializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save(reservation=reservation)
            
            # Update reservation payment status
            total_paid = reservation.payments.filter(status='completed').aggregate(
                total=models.Sum('amount')
            )['total'] or 0
            
            reservation.amount_paid = total_paid
            if total_paid >= reservation.total_amount:
                reservation.payment_status = 'paid'
            elif total_paid > 0:
                reservation.payment_status = 'partial'
            
            reservation.save()
            
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'rating', 'hostel']
    search_fields = ['name', 'email', 'subject', 'message']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return InquiryCreateSerializer
        return InquirySerializer

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Inquiry.objects.all()
        else:
            # Non-admin users can only see their own inquiries
            return Inquiry.objects.filter(email=self.request.user.email)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to an inquiry (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can respond to inquiries'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        inquiry = self.get_object()
        response_text = request.data.get('response')
        
        if not response_text:
            return Response(
                {'error': 'Response text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inquiry.response = response_text
        inquiry.status = 'resolved'
        inquiry.assigned_to = request.user
        inquiry.resolved_at = timezone.now()
        inquiry.save()
        
        return Response({'message': 'Response sent successfully'})

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign inquiry to a staff member (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can assign inquiries'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        inquiry = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if not assigned_to_id:
            return Response(
                {'error': 'Assigned user ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assigned_user = User.objects.get(id=assigned_to_id, role__in=['admin', 'caretaker'])
            inquiry.assigned_to = assigned_user
            inquiry.status = 'in_progress'
            inquiry.save()
            
            return Response({'message': 'Inquiry assigned successfully'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid user assigned'},
                status=status.HTTP_400_BAD_REQUEST
            )


class WaitingListViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hostel', 'preferred_room_type', 'semester', 'academic_year', 'is_active']
    search_fields = ['user__username', 'user__email', 'hostel__name']
    ordering_fields = ['created_at', 'semester']
    ordering = ['created_at']

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return WaitingList.objects.all()
        else:
            return WaitingList.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_entries(self, request):
        """Get current user's waiting list entries"""
        entries = self.get_queryset().filter(user=request.user, is_active=True)
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def contact(self, request, pk=None):
        """Mark waiting list entry as contacted (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can mark entries as contacted'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry = self.get_object()
        entry.contacted_at = timezone.now()
        entry.save()
        
        return Response({'message': 'Entry marked as contacted'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate waiting list entry"""
        entry = self.get_object()
        
        # Check if user can deactivate this entry
        if request.user.role != 'admin' and entry.user != request.user:
            return Response(
                {'error': 'You can only deactivate your own entries'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry.is_active = False
        entry.save()
        
        return Response({'message': 'Entry deactivated successfully'})
