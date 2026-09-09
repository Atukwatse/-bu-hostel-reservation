from django.db import models
from django.conf import settings
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
    admin_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_hostel'
    )
    rooms_status = models.CharField(
        max_length=20, 
        choices=ROOM_STATUS_CHOICES, 
        default='Available'
    )
    is_listed = models.BooleanField(default=True)
    image = models.ImageField(upload_to='room_images/', blank=False, null=False, default='room_images/placeholder.jpg')
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
    image = models.ImageField(upload_to='room_images/', blank=False, null=False, default='room_images/placeholder.jpg')
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


class HostelSubscription(models.Model):
    """A paid subscription a caretaker must hold to list a hostel on the site.

    The system admin (Dean of Students) benefits by charging caretakers a
    subscription fee to add and keep their hostels listed and monitored.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('pending', 'Pending'),
    ]

    caretaker = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='hostel_subscriptions'
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='subscription',
        blank=True,
        null=True
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    paid_via = models.CharField(max_length=20, choices=[
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('upload_receipt', 'Upload Receipt'),
    ])
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    receipt_image = models.ImageField(upload_to='subscription_receipts/', blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Hostel Subscription'
        verbose_name_plural = 'Hostel Subscriptions'

    def __str__(self):
        return f"{self.caretaker.name} - {self.hostel.name} - {self.status}"

    @property
    def is_active(self):
        from django.utils import timezone
        from datetime import date
        today = timezone.localdate()
        return self.status == 'active' and self.start_date <= today <= self.end_date


# Number of days a caretaker has to pay the subscription after their hostel is
# listed. If they fail to pay within this grace period, the hostel is removed
# from the site.
HOSTEL_GRACE_DAYS = 4


def expired_grace_hostels():
    """Return hostels whose 4-day payment grace period has lapsed unpaid.

    These are caretaker-owned hostels that are shown on the site but whose
    caretaker holds no active subscription covering today, and whose listing is
    older than the grace period. They should be removed from the site.
    """
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Exists, OuterRef

    today = timezone.localdate()
    cutoff = timezone.now() - timedelta(days=HOSTEL_GRACE_DAYS)

    active_subs = HostelSubscription.objects.filter(
        caretaker=OuterRef('admin_user'),
        status='active',
        start_date__lte=today,
        end_date__gte=today,
    )
    return Hostel.objects.filter(
        admin_user__isnull=False,
        admin_user__role='caretaker',
        created_at__lt=cutoff,
    ).annotate(has_active=Exists(active_subs)).filter(has_active=False)
