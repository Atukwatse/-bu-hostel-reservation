#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

def test_seattle_hostel():
    seattle = Hostel.objects.filter(name='Seattle Hostel').first()
    if seattle:
        print(f'Seattle Hostel rooms_status: {seattle.rooms_status}')
        print(f'Should show "Hostel Full" button: {seattle.rooms_status == "Full"}')
    else:
        print('Seattle Hostel not found')

if __name__ == '__main__':
    test_seattle_hostel()
