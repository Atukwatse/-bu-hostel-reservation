#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

def update_seattle_hostel():
    seattle = Hostel.objects.filter(name='Seattle Hostel').first()
    if seattle:
        seattle.rooms_status = 'Available'
        seattle.save()
        print('Seattle Hostel rooms_status updated to Available')
    else:
        print('Seattle Hostel not found')

if __name__ == '__main__':
    update_seattle_hostel()
