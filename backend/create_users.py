import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Create Admin User
if not User.objects.filter(email='admin@gmail.com').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@gmail.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        phone='+1234567890'
    )
    print("Admin created.")

# Create Student User
if not User.objects.filter(email='atukwatse@gmail.com').exists():
    student = User.objects.create_user(
        username='atukwatse',
        email='atukwatse@gmail.com',
        password='blessing2004',
        first_name='Atukwatse',
        last_name='Blessing',
        phone='+0987654321'
    )
    student.role = 'student'  # Ensure the user has the correct role if applicable
    student.save()
    print("Student created.")
