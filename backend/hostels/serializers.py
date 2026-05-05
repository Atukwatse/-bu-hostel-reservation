from rest_framework import serializers
from .models import Hostel, HostelImage, Room, Review


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
            'price_per_semester', 'facilities', 'is_available', 'is_full',
            'available_spaces', 'created_at', 'updated_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_email', 'rating', 'comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user']


class HostelSerializer(serializers.ModelSerializer):
    images = HostelImageSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.ReadOnlyField()
    total_rooms = serializers.SerializerMethodField()
    available_rooms = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'type', 'price', 'gender', 'occupancy', 'rating',
            'reviews', 'average_rating', 'caretaker_phone', 'rooms_status',
            'image', 'description', 'facilities', 'location', 'images',
            'rooms', 'total_rooms', 'available_rooms', 'created_at', 'updated_at'
        ]

    def get_total_rooms(self, obj):
        return obj.rooms.count()

    def get_available_rooms(self, obj):
        return obj.rooms.filter(is_available=True).count()


class HostelListSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    total_rooms = serializers.SerializerMethodField()
    available_rooms = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'type', 'price', 'gender', 'occupancy', 'rating',
            'average_rating', 'caretaker_phone', 'rooms_status', 'image',
            'location', 'total_rooms', 'available_rooms', 'created_at'
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
