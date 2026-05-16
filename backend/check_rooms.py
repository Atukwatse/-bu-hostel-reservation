#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

def check_hostel_rooms():
    print("Checking hostel rooms data...")
    
    for hostel in Hostel.objects.all():
        print(f"\nHostel: {hostel.name}")
        print(f"Rooms status: {hostel.rooms_status}")
        print(f"Available rooms: {getattr(hostel, 'available_rooms', 'N/A')}")
        print(f"Total rooms: {getattr(hostel, 'total_rooms', 'N/A')}")
        print(f"Occupancy: {hostel.occupancy}")

if __name__ == '__main__':
    check_hostel_rooms()
