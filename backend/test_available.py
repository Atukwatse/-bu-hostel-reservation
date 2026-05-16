#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

def test_available_hostel():
    bensdorf = Hostel.objects.filter(name='Bensdorf Hostel').first()
    if bensdorf:
        print(f'Bensdorf Hostel rooms_status: {bensdorf.rooms_status}')
        print(f'Should show "Reserve Now" button: {bensdorf.rooms_status != "Full"}')
    else:
        print('Bensdorf Hostel not found')

if __name__ == '__main__':
    test_available_hostel()
