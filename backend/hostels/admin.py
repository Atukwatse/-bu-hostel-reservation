from django.contrib import admin
from .models import Hostel, HostelImage, Room, Review


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'gender', 'rating', 'rooms_status', 'price', 'created_at']
    list_filter = ['type', 'gender', 'rooms_status', 'created_at']
    search_fields = ['name', 'location']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'type', 'gender', 'location')
        }),
        ('Pricing & Availability', {
            'fields': ('price', 'occupancy', 'rooms_status')
        }),
        ('Rating & Reviews', {
            'fields': ('rating', 'reviews')
        }),
        ('Contact Information', {
            'fields': ('caretaker_phone',)
        }),
        ('Additional Information', {
            'fields': ('description', 'facilities', 'image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(HostelImage)
class HostelImageAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'caption', 'created_at']
    list_filter = ['hostel', 'created_at']
    search_fields = ['hostel__name', 'caption']
    readonly_fields = ['created_at']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'room_number', 'room_type', 'capacity', 'current_occupancy', 'price_per_semester', 'is_available']
    list_filter = ['hostel', 'room_type', 'is_available', 'created_at']
    search_fields = ['hostel__name', 'room_number']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hostel')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at', 'hostel']
    search_fields = ['hostel__name', 'user__name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hostel', 'user')
