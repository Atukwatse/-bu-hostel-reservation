import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from users.models import User, UserProfile, LoginActivity
from hostels.models import Hostel, Room, HostelImage, Review
from reservations.models import Inquiry, WaitingList, Reservation, Payment

# Step 1: Clean PostgreSQL default database
print("Cleaning existing postgres data...")
LoginActivity.objects.all().delete()
UserProfile.objects.all().delete()
Payment.objects.all().delete()
Reservation.objects.all().delete()
WaitingList.objects.all().delete()
Inquiry.objects.all().delete()
Review.objects.all().delete()
HostelImage.objects.all().delete()
Room.objects.all().delete()
Hostel.objects.all().delete()
User.objects.all().delete()

# Step 2: Copy from SQLite to PostgreSQL
print("Migrating Users...")
for u in User.objects.using('sqlite').all():
    u.save(using='default')

print("Migrating UserProfiles...")
for up in UserProfile.objects.using('sqlite').all():
    up.save(using='default')

print("Migrating LoginActivity...")
for la in LoginActivity.objects.using('sqlite').all():
    la.save(using='default')

print("Migrating Hostels...")
for h in Hostel.objects.using('sqlite').all():
    h.save(using='default')

print("Migrating Rooms...")
for r in Room.objects.using('sqlite').all():
    r.save(using='default')

print("Migrating HostelImages...")
for hi in HostelImage.objects.using('sqlite').all():
    hi.save(using='default')

print("Migrating Reviews...")
for rev in Review.objects.using('sqlite').all():
    rev.save(using='default')

print("Migrating Inquiries...")
for i in Inquiry.objects.using('sqlite').all():
    i.save(using='default')

print("Migrating WaitingList...")
for wl in WaitingList.objects.using('sqlite').all():
    wl.save(using='default')

print("Migrating Reservations...")
for res in Reservation.objects.using('sqlite').all():
    res.save(using='default')

print("Migrating Payments...")
for p in Payment.objects.using('sqlite').all():
    p.save(using='default')

print("Data migration complete!")
