from django.contrib import admin
from .models import Reservation, Payment, Inquiry, WaitingList


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['reservation_code', 'user', 'hostel', 'status', 'payment_status', 'total_amount', 'amount_paid', 'semester', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method', 'semester', 'academic_year', 'created_at']
    search_fields = ['reservation_code', 'user__username', 'user__email', 'hostel__name']
    readonly_fields = ['reservation_code', 'created_at', 'updated_at', 'confirmed_at', 'cancelled_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'hostel', 'room', 'reservation_code')
        }),
        ('Status Information', {
            'fields': ('status', 'payment_status', 'payment_method')
        }),
        ('Academic Information', {
            'fields': ('semester', 'academic_year')
        }),
        ('Dates', {
            'fields': ('check_in_date', 'check_out_date')
        }),
        ('Payment Information', {
            'fields': ('total_amount', 'amount_paid')
        }),
        ('Additional Information', {
            'fields': ('special_requests', 'notes', 'receipt_image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'cancelled_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'hostel', 'room')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_code', 'reservation', 'amount', 'payment_type', 'payment_method', 'status', 'created_at']
    list_filter = ['payment_type', 'payment_method', 'status', 'created_at']
    search_fields = ['payment_code', 'reservation__reservation_code', 'transaction_id']
    readonly_fields = ['payment_code', 'created_at', 'updated_at', 'processed_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('reservation')


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'hostel', 'subject', 'status', 'priority', 'rating', 'created_at']
    list_filter = ['status', 'priority', 'rating', 'hostel', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email', 'phone', 'country_code')
        }),
        ('Inquiry Details', {
            'fields': ('hostel', 'subject', 'message')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'rating')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Response', {
            'fields': ('response',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hostel', 'assigned_to')


@admin.register(WaitingList)
class WaitingListAdmin(admin.ModelAdmin):
    list_display = ['user', 'hostel', 'preferred_room_type', 'semester', 'academic_year', 'is_active', 'created_at']
    list_filter = ['preferred_room_type', 'is_active', 'semester', 'academic_year', 'created_at']
    search_fields = ['user__username', 'user__email', 'hostel__name']
    readonly_fields = ['created_at', 'contacted_at']
    ordering = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'hostel')
