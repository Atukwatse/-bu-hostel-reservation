#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

from hostels.models import Hostel

def check_hostel_images():
    print("Checking hostel images...")
    
    for hostel in Hostel.objects.all():
        print(f"\nHostel: {hostel.name}")
        print(f"Image field: {hostel.image}")
        
        if hostel.image:
            # Check if file exists
            image_path = os.path.join('media', str(hostel.image))
            full_path = os.path.join(os.getcwd(), image_path)
            exists = os.path.exists(full_path)
            print(f"File path: {image_path}")
            print(f"Full path: {full_path}")
            print(f"File exists: {exists}")
            
            if exists:
                file_size = os.path.getsize(full_path)
                print(f"File size: {file_size} bytes")
            else:
                print("❌ File does not exist!")
        else:
            print("❌ No image set!")

if __name__ == '__main__':
    check_hostel_images()
