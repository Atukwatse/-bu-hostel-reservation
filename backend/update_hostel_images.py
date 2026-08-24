#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

# Map hostel names to their corresponding image files
hostel_image_mapping = {
    'Bensdorf Hostel': 'bensdorf.png',
    'SL Hostel': 'sl.png',
    'Seattle Hostel': 'seatle.png',
    'Clifford Hostel': 'clifford.png',
    'Kenmor Hostel': 'kenmor.png',
    'Rose Hostel': 'rose.png',
    'Endvor Hostel': 'endvor.png',
    'City View Hostel': 'cityview.png',
    'sweet home': 'home.png',  # or home2.png
}

def update_hostel_images():
    print("Updating hostel images...")
    
    for hostel in Hostel.objects.all():
        if hostel.name in hostel_image_mapping:
            image_filename = hostel_image_mapping[hostel.name]
            print(f"Updating {hostel.name} with image: {image_filename}")
            
            # Update the hostel image field
            hostel.image = f'hostel_images/{image_filename}'
            hostel.save()
            
            print(f"✓ {hostel.name} updated successfully")
        else:
            print(f"⚠ No image mapping found for: {hostel.name}")
    
    print("\nHostel images update completed!")

if __name__ == '__main__':
    update_hostel_images()
