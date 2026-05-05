from rest_framework import serializers
from .models import Reservation, Payment, Inquiry, WaitingList
from hostels.models import Hostel, Room


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_code', 'amount', 'payment_type', 'payment_method',
            'status', 'transaction_id', 'receipt_image', 'notes',
            'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = ['payment_code', 'created_at', 'updated_at', 'processed_at']


class ReservationSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    balance_due = serializers.ReadOnlyField()
    is_fully_paid = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'user', 'user_name', 'hostel', 'hostel_name', 'room',
            'room_number', 'reservation_code', 'status', 'payment_status',
            'payment_method', 'amount_paid', 'total_amount', 'balance_due',
            'is_fully_paid', 'semester', 'academic_year', 'check_in_date',
            'check_out_date', 'special_requests', 'notes', 'receipt_image',
            'payments', 'is_active', 'created_at', 'updated_at',
            'confirmed_at', 'cancelled_at'
        ]
        read_only_fields = [
            'reservation_code', 'user', 'amount_paid', 'created_at',
            'updated_at', 'confirmed_at', 'cancelled_at'
        ]

    def validate_hostel(self, value):
        if value.rooms_status == 'Full':
            raise serializers.ValidationError("This hostel is currently full.")
        return value

    def validate_room(self, value):
        if value and not value.is_available:
            raise serializers.ValidationError("This room is not available.")
        if value and value.is_full:
            raise serializers.ValidationError("This room is already full.")
        return value


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'hostel', 'room', 'payment_method', 'total_amount', 'semester',
            'academic_year', 'check_in_date', 'check_out_date',
            'special_requests', 'notes', 'receipt_image'
        ]

    def validate(self, data):
        hostel = data.get('hostel')
        room = data.get('room')
        user = self.context['request'].user
        
        # Check if user already has an active reservation for this semester
        existing_reservation = Reservation.objects.filter(
            user=user,
            semester=data.get('semester'),
            academic_year=data.get('academic_year'),
            status__in=['pending', 'confirmed']
        ).first()
        
        if existing_reservation:
            raise serializers.ValidationError(
                "You already have an active reservation for this semester."
            )
        
        # Validate room availability
        if room and room.hostel != hostel:
            raise serializers.ValidationError("Selected room does not belong to the selected hostel.")
        
        if room and not room.is_available:
            raise serializers.ValidationError("Selected room is not available.")
        
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class InquirySerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            'id', 'name', 'email', 'phone', 'country_code', 'hostel',
            'hostel_name', 'subject', 'message', 'status', 'priority',
            'rating', 'assigned_to', 'assigned_to_name', 'response',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = [
            'assigned_to', 'created_at', 'updated_at', 'resolved_at'
        ]


class InquiryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = [
            'name', 'email', 'phone', 'country_code', 'hostel', 'subject',
            'message', 'priority'
        ]

    def create(self, validated_data):
        return super().create(validated_data)


class WaitingListSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = WaitingList
        fields = [
            'id', 'user', 'user_name', 'hostel', 'hostel_name',
            'preferred_room_type', 'semester', 'academic_year',
            'special_requests', 'is_active', 'created_at', 'contacted_at'
        ]
        read_only_fields = ['user', 'created_at', 'contacted_at']

    def validate(self, data):
        user = self.context['request'].user
        
        # Check if user is already on waiting list for this hostel/semester
        existing_entry = WaitingList.objects.filter(
            user=user,
            hostel=data.get('hostel'),
            semester=data.get('semester'),
            academic_year=data.get('academic_year')
        ).first()
        
        if existing_entry:
            raise serializers.ValidationError(
                "You are already on the waiting list for this hostel and semester."
            )
        
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
