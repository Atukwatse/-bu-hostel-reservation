from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hostels.models import Hostel, Room, Review
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data for the hostel reservation system'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed data...')
        
        # Create admin user
        self.create_admin_user()
        
        # Create caretakers
        self.create_caretakers()
        
        # Create hostels
        self.create_hostels()
        
        # Create rooms for hostels
        self.create_rooms()
        
        # Create sample reviews
        self.create_reviews()
        
        self.stdout.write(self.style.SUCCESS('Data seeding completed successfully!'))

    def create_admin_user(self):
        """Create admin user if it doesn't exist"""
        if not User.objects.filter(username='admin').exists():
            User.objects.create_user(
                username='admin',
                email='admin@buhostel.com',
                phone='256700000000',
                country_code='+256',
                password='admin123',
                first_name='System',
                last_name='Administrator',
                role='admin',
                is_staff=True,
                is_superuser=True,
                is_verified=True
            )
            self.stdout.write('Created admin user')

    def create_caretakers(self):
        """Create caretaker users for the hostels"""
        caretakers_data = [
            {'username': 'caretaker1', 'first_name': 'Jane', 'last_name': 'Doe', 'phone': '256769559707', 'email': 'jane@buhostel.com'},
            {'username': 'caretaker2', 'first_name': 'John', 'last_name': 'Smith', 'phone': '256744895697', 'email': 'john@buhostel.com'},
            {'username': 'caretaker3', 'first_name': 'Mary', 'last_name': 'Johnson', 'phone': '256772345678', 'email': 'mary@buhostel.com'},
            {'username': 'caretaker4', 'first_name': 'Sarah', 'last_name': 'Williams', 'phone': '256798765432', 'email': 'sarah@buhostel.com'},
            {'username': 'caretaker5', 'first_name': 'Peter', 'last_name': 'Brown', 'phone': '256765432109', 'email': 'peter@buhostel.com'},
            {'username': 'caretaker6', 'first_name': 'David', 'last_name': 'Jones', 'phone': '256734567890', 'email': 'david@buhostel.com'},
        ]
        for c in caretakers_data:
            if not User.objects.filter(phone=c['phone']).exists():
                User.objects.create_user(
                    username=c['username'],
                    email=c['email'],
                    phone=c['phone'],
                    country_code='+256',
                    password='Caretaker@2026!',
                    first_name=c['first_name'],
                    last_name=c['last_name'],
                    role='caretaker',
                    is_verified=True
                )
                self.stdout.write(f"Created caretaker: {c['first_name']} {c['last_name']}")

    def create_hostels(self):
        """Create initial hostels"""
        hostels_data = [
            {
                'name': 'Bensdorf Hostel',
                'type': 'university',
                'price': 'UGX 750,000 /sem',
                'gender': 'Female',
                'occupancy': '45/60 Occupied',
                'rating': Decimal('4.0'),
                'reviews': 12,
                'caretaker_phone': '256769559707',
                'rooms_status': 'Available',
                'description': 'A comfortable and secure female hostel located within the university premises.',
                'facilities': 'Wi-Fi, Laundry, Study Room, Security, Kitchen, Common Room',
                'location': 'Bugema University Main Campus',
                'image': '/IMAGES/bensdorf.png'
            },
            {
                'name': 'SL Hostel',
                'type': 'university',
                'price': 'UGX 650,000 /sem',
                'gender': 'Male',
                'occupancy': '85/100 Occupied',
                'rating': Decimal('4.8'),
                'reviews': 24,
                'caretaker_phone': '256744895697',
                'rooms_status': 'Available',
                'description': 'Modern male hostel with excellent facilities and 24/7 security.',
                'facilities': 'Wi-Fi, Gym, Study Room, Security, Kitchen, Sports Ground',
                'location': 'Bugema University Main Campus',
                'image': '/IMAGES/sl.png'
            },
            {
                'name': 'Seattle Hostel',
                'type': 'university',
                'price': 'UGX 680,000 /sem',
                'gender': 'Male',
                'occupancy': '120/120 Occupied',
                'rating': Decimal('3.2'),
                'reviews': 8,
                'caretaker_phone': '256744895697',
                'rooms_status': 'Full',
                'description': 'Affordable male hostel with basic amenities.',
                'facilities': 'Wi-Fi, Security, Common Room, Kitchen',
                'location': 'Bugema University Main Campus',
                'image': '/IMAGES/seatle.png'
            },
            {
                'name': 'Clifford Hostel',
                'type': 'university',
                'price': 'UGX 700,000 /sem',
                'gender': 'Female',
                'occupancy': '70/80 Occupied',
                'rating': Decimal('4.2'),
                'reviews': 19,
                'caretaker_phone': '256769559707',
                'rooms_status': 'Available',
                'description': 'Premium female hostel with modern facilities and excellent security.',
                'facilities': 'Wi-Fi, Laundry, Study Room, Security, Kitchen, Common Room, Gym',
                'location': 'Bugema University Main Campus',
                'image': '/IMAGES/clifford.png'
            },
            {
                'name': 'Cityview Hostel',
                'type': 'private',
                'price': 'UGX 720,000 /sem',
                'gender': 'Male',
                'occupancy': '75/90 Occupied',
                'rating': Decimal('4.1'),
                'reviews': 16,
                'caretaker_phone': '256772345678',
                'rooms_status': 'Available',
                'description': 'Private male hostel with city views and modern amenities.',
                'facilities': 'Wi-Fi, Laundry, Study Room, Security, Kitchen, Balcony',
                'location': 'Near Bugema University',
                'image': '/IMAGES/cityview.png'
            },
            {
                'name': 'Rose Hostel',
                'type': 'private',
                'price': 'UGX 580,000 /sem',
                'gender': 'Female',
                'occupancy': '60/75 Occupied',
                'rating': Decimal('4.7'),
                'reviews': 31,
                'caretaker_phone': '256798765432',
                'rooms_status': 'Available',
                'description': 'Affordable private female hostel with homely atmosphere.',
                'facilities': 'Wi-Fi, Laundry, Security, Kitchen, Common Room',
                'location': 'Near Bugema University',
                'image': '/IMAGES/rose.png'
            },
            {
                'name': 'Endeavor Hostel',
                'type': 'private',
                'price': 'UGX 750,000 /sem',
                'gender': 'Mixed',
                'occupancy': '70/85 Occupied',
                'rating': Decimal('4.3'),
                'reviews': 22,
                'caretaker_phone': '256765432109',
                'rooms_status': 'Available',
                'description': 'Mixed hostel with separate wings for male and female students.',
                'facilities': 'Wi-Fi, Laundry, Study Room, Security, Kitchen, Common Room, Sports',
                'location': 'Near Bugema University',
                'image': '/IMAGES/endvor.png'
            },
            {
                'name': 'Kernmol Hostel',
                'type': 'private',
                'price': 'UGX 680,000 /sem',
                'gender': 'Male',
                'occupancy': '65/80 Occupied',
                'rating': Decimal('3.5'),
                'reviews': 9,
                'caretaker_phone': '256734567890',
                'rooms_status': 'Available',
                'description': 'Budget-friendly private male hostel with essential facilities.',
                'facilities': 'Wi-Fi, Security, Common Room, Kitchen',
                'location': 'Near Bugema University',
                'image': '/IMAGES/kenmor.png'
            }
        ]

        for hostel_data in hostels_data:
            hostel, created = Hostel.objects.update_or_create(
                name=hostel_data['name'],
                defaults=hostel_data
            )
            if created:
                self.stdout.write(f'Created hostel: {hostel.name}')
            else:
                self.stdout.write(f'Updated hostel: {hostel.name}')

    def create_rooms(self):
        """Create rooms for each hostel"""
        room_types = [
            {'type': 'Single', 'capacity': 1, 'price': Decimal('850000')},
            {'type': 'Double', 'capacity': 2, 'price': Decimal('650000')},
            {'type': 'Dormitory', 'capacity': 4, 'price': Decimal('450000')}
        ]

        for hostel in Hostel.objects.all():
            for i in range(1, 6):  # Create 5 rooms per hostel
                room_type = random.choice(room_types)
                current_occupancy = random.randint(0, room_type['capacity'])
                
                Room.objects.get_or_create(
                    hostel=hostel,
                    room_number=f'{hostel.name[:3].upper()}{i}',
                    defaults={
                        'room_type': room_type['type'],
                        'capacity': room_type['capacity'],
                        'current_occupancy': current_occupancy,
                        'price_per_semester': room_type['price'],
                        'facilities': 'Wi-Fi, Study Desk, Wardrobe, Bed',
                        'is_available': current_occupancy < room_type['capacity']
                    }
                )

        self.stdout.write('Created rooms for all hostels')

    def create_reviews(self):
        """Create sample reviews for hostels"""
        sample_reviews = [
            {'rating': 5, 'comment': 'Excellent hostel with great facilities!'},
            {'rating': 4, 'comment': 'Good value for money, clean and secure.'},
            {'rating': 3, 'comment': 'Average facilities, could be better.'},
            {'rating': 5, 'comment': 'Amazing experience, highly recommended!'},
            {'rating': 4, 'comment': 'Nice place to stay, friendly staff.'},
        ]

        # Create a sample user for reviews
        if not User.objects.filter(username='student1').exists():
            student = User.objects.create_user(
                username='student1',
                email='student1@example.com',
                phone='256712345678',
                country_code='+256',
                password='student123',
                first_name='John',
                last_name='Doe',
                role='student',
                is_verified=True
            )
        else:
            student = User.objects.get(username='student1')

        for hostel in Hostel.objects.all():
            for review_data in sample_reviews[:2]:  # Add 2 reviews per hostel
                Review.objects.get_or_create(
                    user=student,
                    hostel=hostel,
                    defaults=review_data
                )

        self.stdout.write('Created sample reviews')
