from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, LoginActivity


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'phone', 'role', 'gender', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'gender', 'is_verified', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'phone', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('username', 'first_name', 'last_name', 'email', 'phone', 'country_code')
        }),
        ('Academic Information', {
            'fields': ('role', 'gender', 'student_id', 'program_of_study', 'year_of_study')
        }),
        ('Emergency Contact', {
            'fields': ('next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_country_code')
        }),
        ('Profile', {
            'fields': ('profile_picture',)
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone', 'country_code', 'password1', 'password2'),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'date_of_birth', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'bio', 'date_of_birth', 'address')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_country_code')
        }),
        ('Preferences', {
            'fields': ('preferences',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'login_time', 'logout_time', 'is_successful']
    list_filter = ['is_successful', 'login_time']
    search_fields = ['user__username', 'user__email', 'ip_address']
    readonly_fields = ['login_time']
    ordering = ['-login_time']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
