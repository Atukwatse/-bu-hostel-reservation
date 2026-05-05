from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
        ('partial', 'Partial'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('upload_receipt', 'Upload Receipt'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reservations')
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE, related_name='reservations')
    room = models.ForeignKey('hostels.Room', on_delete=models.CASCADE, related_name='reservations', blank=True, null=True)
    reservation_code = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    semester = models.CharField(max_length=50)  # e.g., "Fall 2024"
    academic_year = models.CharField(max_length=20)  # e.g., "2024-2025"
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    special_requests = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'

    def __str__(self):
        return f"{self.user.name} - {self.hostel.name} - {self.reservation_code}"

    def save(self, *args, **kwargs):
        if not self.reservation_code:
            # Generate unique reservation code
            import uuid
            self.reservation_code = f"RES{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status in ['pending', 'confirmed']

    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid

    @property
    def is_fully_paid(self):
        return self.amount_paid >= self.total_amount


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('full_payment', 'Full Payment'),
        ('balance', 'Balance Payment'),
        ('refund', 'Refund'),
    ]

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='payments')
    payment_code = models.CharField(max_length=20, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    payment_method = models.CharField(max_length=20, choices=Reservation.PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    receipt_image = models.ImageField(upload_to='payment_receipts/', blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"{self.reservation.reservation_code} - {self.amount}"

    def save(self, *args, **kwargs):
        if not self.payment_code:
            # Generate unique payment code
            import uuid
            self.payment_code = f"PAY{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    country_code = models.CharField(max_length=10, default='+256')
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.SET_NULL, blank=True, null=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_inquiries')
    response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Inquiry'
        verbose_name_plural = 'Inquiries'

    def __str__(self):
        return f"{self.name} - {self.subject}"


class WaitingList(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='waiting_list_entries')
    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.CASCADE, related_name='waiting_list')
    preferred_room_type = models.CharField(
        max_length=20,
        choices=[
            ('Single', 'Single'),
            ('Double', 'Double'),
            ('Dormitory', 'Dormitory'),
            ('Any', 'Any'),
        ],
        default='Any'
    )
    semester = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    special_requests = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    contacted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Waiting List Entry'
        verbose_name_plural = 'Waiting List Entries'
        unique_together = ['user', 'hostel', 'semester', 'academic_year']

    def __str__(self):
        return f"{self.user.name} - {self.hostel.name} - Waiting List"
