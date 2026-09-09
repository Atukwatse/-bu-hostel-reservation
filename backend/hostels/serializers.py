from rest_framework import serializers
from .models import Hostel, HostelImage, Room, Review, HostelSubscription


class HostelSubscriptionSerializer(serializers.ModelSerializer):
    caretaker_name = serializers.CharField(source='caretaker.name', read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = HostelSubscription
        fields = [
            'id', 'caretaker', 'caretaker_name', 'hostel', 'hostel_name',
            'amount_paid', 'paid_via', 'transaction_id', 'status',
            'receipt_image', 'start_date', 'end_date',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['caretaker', 'created_at', 'updated_at']


class HostelSubscriptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelSubscription
        fields = [
            'hostel', 'amount_paid', 'paid_via', 'transaction_id',
            'receipt_image', 'start_date', 'end_date'
        ]

    def create(self, validated_data):
        validated_data['caretaker'] = self.context['request'].user
        # New subscriptions start pending until the admin verifies the payment
        # and activates them.
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class HostelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelImage
        fields = ['id', 'image', 'caption', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    is_full = serializers.ReadOnlyField()
    available_spaces = serializers.ReadOnlyField()

    class Meta:
        model = Room
        fields = [
            'id', 'hostel', 'room_number', 'room_type', 'capacity', 'current_occupancy',
            'price_per_semester', 'facilities', 'image', 'is_available', 'is_full',
            'available_spaces', 'created_at', 'updated_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'hostel', 'hostel_name', 'user', 'user_name', 'user_email',
            'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']


class HostelSerializer(serializers.ModelSerializer):
    images = HostelImageSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    hostel_reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.ReadOnlyField()
    total_rooms = serializers.SerializerMethodField()
    available_rooms = serializers.SerializerMethodField()
    admin_user_name = serializers.CharField(source='admin_user.name', read_only=True)
    admin_user_phone = serializers.CharField(source='admin_user.phone', read_only=True)

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'type', 'price', 'gender', 'occupancy', 'rating',
            'reviews', 'average_rating', 'caretaker_phone', 'admin_user',
            'admin_user_name', 'admin_user_phone', 'rooms_status',
            'is_listed', 'image', 'description', 'facilities', 'location', 'images',
            'rooms', 'total_rooms', 'available_rooms', 'hostel_reviews', 'created_at', 'updated_at'
        ]

    def get_total_rooms(self, obj):
        return obj.rooms.count()

    def get_available_rooms(self, obj):
        return obj.rooms.filter(is_available=True).count()


class HostelListSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    total_rooms = serializers.SerializerMethodField()
    available_rooms = serializers.SerializerMethodField()
    admin_user_name = serializers.CharField(source='admin_user.name', read_only=True)
    admin_user_phone = serializers.CharField(source='admin_user.phone', read_only=True)

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'type', 'price', 'gender', 'occupancy', 'rating',
            'average_rating', 'caretaker_phone', 'admin_user',
            'admin_user_name', 'admin_user_phone', 'rooms_status', 'image',
            'is_listed', 'location', 'total_rooms', 'available_rooms', 'created_at'
        ]

    def get_total_rooms(self, obj):
        return obj.rooms.count()

    def get_available_rooms(self, obj):
        return obj.rooms.filter(is_available=True).count()


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['hostel', 'rating', 'comment']

    def validate(self, data):
        user = self.context['request'].user
        hostel = data['hostel']
        
        # Check if user already reviewed this hostel
        if Review.objects.filter(user=user, hostel=hostel).exists():
            raise serializers.ValidationError("You have already reviewed this hostel.")
        
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class HostelOnboardSerializer(serializers.Serializer):
    """Single-step onboarding for a new caretaker.

    Creates the caretaker account, their hostel (as a draft), and a pending
    subscription - all in one transactional request, so the caretaker can go
    straight to 'Add Your Hostel' without signing up separately.
    """
    # Account fields
    name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    phone = serializers.CharField(write_only=True)
    gender = serializers.ChoiceField(choices=['Male', 'Female'], required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    # Hostel fields
    hostel_name = serializers.CharField(write_only=True)
    hostel_type = serializers.ChoiceField(choices=['university', 'private'], write_only=True)
    price = serializers.CharField(write_only=True)
    gender_pref = serializers.ChoiceField(choices=['Male', 'Female', 'Mixed'], write_only=True)
    occupancy = serializers.CharField(write_only=True, required=False, allow_blank=True)
    caretaker_phone = serializers.CharField(write_only=True)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    facilities = serializers.CharField(write_only=True, required=False, allow_blank=True)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Subscription fields
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    paid_via = serializers.ChoiceField(
        choices=['mobile_money', 'bank_transfer', 'cash', 'upload_receipt'],
        write_only=True,
    )
    transaction_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    receipt_image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    start_date = serializers.DateField(write_only=True)
    end_date = serializers.DateField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        if not data['name'].strip() or len(data['name'].split()) < 2:
            raise serializers.ValidationError('Please enter your full name (at least two names).')
        return data

    def create(self, validated_data):
        from django.db import transaction
        from users.models import User, UserProfile
        from .models import Hostel, HostelSubscription

        email = validated_data['email'].strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})

        with transaction.atomic():
            raw_name = validated_data['name'].strip()
            parts = raw_name.split(None, 1)
            first_name = parts[0] if parts else ''
            last_name = parts[1] if len(parts) > 1 else ''

            user = User.objects.create_user(
                username=email,
                email=email,
                password=validated_data['password'],
                first_name=first_name,
                last_name=last_name,
                phone=validated_data['phone'].strip(),
                gender=validated_data.get('gender') or None,
                role='caretaker',
            )
            UserProfile.objects.get_or_create(user=user)

            hostel = Hostel.objects.create(
                name=validated_data['hostel_name'].strip(),
                type=validated_data['hostel_type'],
                price=validated_data['price'].strip(),
                gender=validated_data['gender_pref'],
                occupancy=validated_data.get('occupancy') or '0/0 Occupied',
                rating=0.0,
                reviews=0,
                caretaker_phone=validated_data['caretaker_phone'].strip(),
                admin_user=user,
                image=validated_data.get('image') or 'room_images/placeholder.jpg',
                description=validated_data.get('description', ''),
                facilities=validated_data.get('facilities', ''),
                location=validated_data.get('location', ''),
                # The hostel is shown on the site immediately. The caretaker gets
                # a 4-day grace period to pay the subscription fee; an unpaid
                # hostel is removed by the grace-period enforcement logic.
                is_listed=True,
            )

            HostelSubscription.objects.create(
                caretaker=user,
                hostel=hostel,
                amount_paid=validated_data['amount_paid'],
                paid_via=validated_data['paid_via'],
                transaction_id=validated_data.get('transaction_id', ''),
                status='pending',
                receipt_image=validated_data.get('receipt_image'),
                start_date=validated_data['start_date'],
                end_date=validated_data['end_date'],
            )

        return {
            'user_id': user.id,
            'username': user.username,
            'hostel_id': hostel.id,
            'hostel_name': hostel.name,
        }
