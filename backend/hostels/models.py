from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Hostel(models.Model):
    TYPE_CHOICES = [
        ('university', 'University'),
        ('private', 'Private'),
    ]
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Mixed', 'Mixed'),
    ]
    
    ROOM_STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Full', 'Full'),
        ('Limited', 'Limited'),
    ]

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    price = models.CharField(max_length=100)  # e.g., "UGX 750,000 /sem"
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    occupancy = models.CharField(max_length=50)  # e.g., "45/60 Occupied"
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    reviews = models.PositiveIntegerField(default=0)
    caretaker_phone = models.CharField(max_length=20)
    rooms_status = models.CharField(
        max_length=20, 
        choices=ROOM_STATUS_CHOICES, 
        default='Available'
    )
    image = models.ImageField(upload_to='hostel_images/', blank=True, null=True)
    description = models.TextField(blank=True)
    facilities = models.TextField(blank=True)  # Comma-separated facilities
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Hostel'
        verbose_name_plural = 'Hostels'

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        return float(self.rating)


class HostelImage(models.Model):
    hostel = models.ForeignKey(Hostel, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='hostel_images/')
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Hostel Image'
        verbose_name_plural = 'Hostel Images'

    def __str__(self):
        return f"{self.hostel.name} - Image"


class Room(models.Model):
    TYPE_CHOICES = [
        ('Single', 'Single'),
        ('Double', 'Double'),
        ('Dormitory', 'Dormitory'),
    ]
    
    hostel = models.ForeignKey(Hostel, related_name='rooms', on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20)
    room_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    capacity = models.PositiveIntegerField()
    current_occupancy = models.PositiveIntegerField(default=0)
    price_per_semester = models.DecimalField(max_digits=10, decimal_places=2)
    facilities = models.TextField(blank=True)  # Comma-separated facilities
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['room_number']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
        unique_together = ['hostel', 'room_number']

    def __str__(self):
        return f"{self.hostel.name} - {self.room_number}"

    @property
    def is_full(self):
        return self.current_occupancy >= self.capacity

    @property
    def available_spaces(self):
        return self.capacity - self.current_occupancy


class Review(models.Model):
    hostel = models.ForeignKey(Hostel, related_name='hostel_reviews', on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        unique_together = ['hostel', 'user']

    def __str__(self):
        return f"{self.user.name} - {self.hostel.name} - {self.rating} stars"
