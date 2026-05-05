from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import models
from .models import User, UserProfile, LoginActivity


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'bio', 'date_of_birth', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_country_code',
            'preferences', 'created_at', 'updated_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'country_code', 'role', 'gender', 'student_id', 'program_of_study',
            'year_of_study', 'next_of_kin_name', 'next_of_kin_phone',
            'next_of_kin_country_code', 'profile_picture', 'is_verified',
            'full_name', 'name', 'profile', 'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = ['is_verified', 'date_joined', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'phone', 'country_code', 'gender', 'student_id',
            'program_of_study', 'year_of_study', 'next_of_kin_name',
            'next_of_kin_phone', 'next_of_kin_country_code'
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    name = serializers.CharField()
    password = serializers.CharField()
    role = serializers.CharField(required=False, default='student')

    def validate(self, data):
        name = data.get('name')
        password = data.get('password')
        role = data.get('role', 'student')
        
        if name and password:
            # Try to find user by name (first_name + last_name or username)
            try:
                user = User.objects.filter(
                    models.Q(first_name__icontains=name.split()[0]) & 
                    models.Q(last_name__icontains=' '.join(name.split()[1:]) if len(name.split()) > 1 else models.Q(last_name__icontains=''))
                ).first()
                
                if not user:
                    # Try by username if name search fails
                    user = User.objects.filter(username__icontains=name).first()
                
                if not user:
                    raise serializers.ValidationError('Invalid credentials.')
                
                # Verify password
                if not user.check_password(password):
                    raise serializers.ValidationError('Invalid credentials.')
                
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')
            
            if user.role != role:
                raise serializers.ValidationError(f'Invalid credentials for {role} role.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError('Must include name and password.')


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'gender',
            'student_id', 'program_of_study', 'year_of_study',
            'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_country_code',
            'profile_picture', 'profile'
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile if provided
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return data

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class LoginActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = LoginActivity
        fields = [
            'id', 'user', 'user_name', 'user_email', 'ip_address',
            'user_agent', 'login_time', 'logout_time', 'is_successful'
        ]
        read_only_fields = ['user', 'ip_address', 'user_agent']
