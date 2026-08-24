from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model
import re
import time
import random
import string
import uuid
from .models import Reservation, Payment, Inquiry, WaitingList
from .emails import send_cancellation_email
from .mobile_money import parse_mobile_money_message

User = get_user_model()


# ---------------------------------------------------------------------------
# Simulated MTN Mobile Money payment gateway
# Mirrors the real MTN MoMo Collection API flow: a payment request ("prompt")
# is pushed to the payer's phone, the payer approves it with their PIN, and
# MTN returns a transaction ID which we hand back to the frontend.
# ---------------------------------------------------------------------------

MTN_PENDING_PAYMENTS = {}
MTN_PHONE_RE = re.compile(r'^0\d{9}$')
MTN_APPROVAL_TIMEOUT_SECONDS = 90


def _normalize_mtn_phone(raw):
    """Normalize a Ugandan phone number to local format 07XXXXXXXX."""
    phone = re.sub(r'[\s\-()]', '', str(raw or ''))
    if phone.startswith('+'):
        phone = phone[1:]
    if phone.startswith('256') and len(phone) == 12:
        phone = '0' + phone[3:]
    elif len(phone) == 9 and phone.startswith('7'):
        phone = '0' + phone
    return phone


def _mask_phone(phone):
    return f'{phone[:4]} *** {phone[-3:]}'


def _generate_mtn_transaction_id():
    """Generate a transaction ID in the real MTN MoMo format, e.g. MP240622.1430.A67890"""
    now = timezone.localtime()
    letter = random.choice(string.ascii_uppercase)
    digits = ''.join(random.choices(string.digits, k=5))
    return f'MP{now:%y%m%d}.{now:%H%M}.{letter}{digits}'
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

    @action(detail=False, methods=['post'])
    def parse_mobile_money(self, request):
        """Parse a pasted mobile money SMS and return structured payment details"""
        message = request.data.get('message', '')
        if not message or not str(message).strip():
            return Response(
                {'error': 'A mobile money message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = parse_mobile_money_message(message)
        if not result:
            return Response(
                {'error': 'Could not parse the message. Please enter the details manually.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        if not result.get('transaction_id') and not result.get('amount'):
            return Response(
                {
                    'error': 'This does not look like a valid Mobile Money confirmation message. Please check and try again.',
                    'parsed': result
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        return Response(result)

    @action(detail=False, methods=['post'])
    def initiate_mtn_payment(self, request):
        """Push a payment request to the payer's phone (like the MTN MoMo prompt).

        The user only supplies their number; no SMS is pasted anywhere.
        Returns a reference the frontend polls until MTN confirms the payment.
        """
        phone = _normalize_mtn_phone(request.data.get('phone'))
        if not MTN_PHONE_RE.fullmatch(phone):
            return Response(
                {'error': 'Enter a valid Ugandan mobile money number, e.g. 0772123456'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount = float(request.data.get('amount'))
        except (TypeError, ValueError):
            amount = 0
        if amount <= 0:
            return Response(
                {'error': 'A valid payment amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reference = f'BUMO{uuid.uuid4().hex.upper()[:12]}'
        # Simulates how long the payer takes to enter their MoMo PIN
        approval_delay = random.uniform(6, 12)
        MTN_PENDING_PAYMENTS[reference] = {
            'phone': phone,
            'amount': amount,
            'status': 'PENDING',
            'initiated_at': time.time(),
            'approve_after': time.time() + approval_delay,
            'transaction_id': None,
            'completed_at': None,
        }

        return Response({
            'reference': reference,
            'status': 'PENDING',
            'provider': 'MTN MoMo',
            'message': (
                f'A payment request of UGX {int(amount):,} has been sent to '
                f'{_mask_phone(phone)}. Enter your MTN MoMo PIN to approve it.'
            ),
        })

    @action(detail=False, methods=['get'])
    def mtn_payment_status(self, request):
        """Poll the simulated gateway: PENDING -> SUCCESSFUL with an auto-generated transaction ID."""
        reference = request.query_params.get('reference', '')
        txn = MTN_PENDING_PAYMENTS.get(reference)
        if not txn:
            return Response({'error': 'Unknown payment reference'}, status=status.HTTP_404_NOT_FOUND)

        if txn['status'] == 'PENDING':
            if time.time() - txn['initiated_at'] > MTN_APPROVAL_TIMEOUT_SECONDS:
                txn['status'] = 'EXPIRED'
            elif time.time() >= txn['approve_after']:
                txn['status'] = 'SUCCESSFUL'
                txn['completed_at'] = timezone.now()
                txn['transaction_id'] = _generate_mtn_transaction_id()

        payload = {
            'status': txn['status'],
            'provider': 'MTN MoMo',
            'phone': _mask_phone(txn['phone']),
            'amount': txn['amount'],
            'currency': 'UGX',
        }
        if txn['status'] == 'SUCCESSFUL':
            payload['transaction_id'] = txn['transaction_id']
            payload['datetime'] = timezone.localtime(txn['completed_at']).strftime('%Y-%m-%d %H:%M')
        return Response(payload)

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
        
        # Mark pending payments as completed
        pending_payments = reservation.payments.filter(status='pending')
        for payment in pending_payments:
            payment.status = 'completed'
            payment.processed_at = timezone.now()
            payment.save()
        
        # Update amount_paid and payment_status
        total_paid = reservation.payments.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        reservation.amount_paid = total_paid
        if total_paid >= reservation.total_amount:
            reservation.payment_status = 'paid'
        elif total_paid > 0:
            reservation.payment_status = 'partial'
            
        reservation.save()
        
        # Update room occupancy if room is assigned
        if reservation.room:
            reservation.room.current_occupancy += 1
            reservation.room.save()
        
        return Response({'message': 'Reservation and payments confirmed successfully'})

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
        
        was_confirmed = reservation.status == 'confirmed'
        
        reservation.status = 'cancelled'
        reservation.cancelled_at = timezone.now()
        reservation.save()
        
        # Update room occupancy if room was assigned and reservation was confirmed
        if reservation.room and was_confirmed:
            reservation.room.current_occupancy = max(0, reservation.room.current_occupancy - 1)
            reservation.room.save()
        
        # Notify the student by email that their booking has been cancelled
        send_cancellation_email(reservation)
        
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
                total=Sum('amount')
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
