from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
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
    """Accept either `name` (student full name) or `username` (admin / email / username)."""
    name = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField()
    role = serializers.CharField(required=False, default='student')

    def validate(self, data):
        name = (data.get('name') or '').strip()
        username = (data.get('username') or '').strip()
        login_id = name or username
        password = data.get('password')
        role = data.get('role', 'student')

        if not login_id or not password:
            raise serializers.ValidationError('Must include name or username and password.')

        user = User.objects.filter(email__iexact=login_id).first()
        if not user:
            user = User.objects.filter(username__iexact=login_id).first()
        if not user:
            parts = login_id.split()
            if len(parts) >= 2:
                user = User.objects.filter(
                    first_name__iexact=parts[0],
                    last_name__iexact=' '.join(parts[1:])
                ).first()
            elif len(parts) == 1:
                user = User.objects.filter(first_name__iexact=parts[0]).first()
                if not user:
                    user = User.objects.filter(username__icontains=login_id).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials.')

        if user.role != role:
            raise serializers.ValidationError(f'Invalid credentials for {role} role.')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        data['user'] = user
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone', 'gender',
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


class CaretakerAdminCreateSerializer(serializers.ModelSerializer):
    """Admin-only create for caretaker accounts (sets role=caretaker)."""
    name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'gender', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        raw_name = validated_data.pop('name').strip()
        parts = raw_name.split(None, 1)
        first_name = parts[0] if parts else ''
        last_name = parts[1] if len(parts) > 1 else ''

        email = validated_data['email'].strip()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=validated_data['phone'].strip(),
            gender=validated_data.get('gender') or None,
            role='caretaker',
        )
        UserProfile.objects.get_or_create(user=user)
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
