# BU Hostel Reservation System - Django Backend

A comprehensive Django REST API backend for the Bugema University Hostel Reservation System.

## Features

- **User Management**: Student, Admin, and Caretaker roles
- **Hostel Management**: Complete CRUD operations for hostels
- **Reservation System**: Booking and payment management
- **Inquiry System**: Student inquiries and responses
- **Review System**: Hostel ratings and reviews
- **Waiting List**: Manage hostel waiting lists
- **Authentication**: Token-based authentication
- **Admin Panel**: Django admin interface

## Project Structure

```
backend/
├── bu_hostel_backend/          # Main Django project
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py                # Main URL configuration
│   ├── wsgi.py                # WSGI configuration
│   └── asgi.py                # ASGI configuration
├── hostels/                   # Hostels app
│   ├── models.py              # Hostel models
│   ├── views.py               # Hostel API views
│   ├── serializers.py         # API serializers
│   ├── urls.py                # Hostel URLs
│   ├── admin.py               # Django admin
│   └── management/            # Management commands
├── users/                     # Users app
│   ├── models.py              # User models
│   ├── views.py               # User API views
│   ├── serializers.py         # API serializers
│   ├── urls.py                # User URLs
│   └── admin.py               # Django admin
├── reservations/              # Reservations app
│   ├── models.py              # Reservation models
│   ├── views.py               # Reservation API views
│   ├── serializers.py         # API serializers
│   ├── urls.py                # Reservation URLs
│   └── admin.py               # Django admin
├── manage.py                  # Django management script
└── requirements.txt           # Python dependencies
```

## Installation

### Prerequisites

- Python 3.8+
- pip
- virtualenv (recommended)

### Setup Steps

1. **Clone the project and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Seed initial data:**
   ```bash
   python manage.py seed_data
   ```

7. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - User registration
- `GET /api/auth/me/` - Get current user

### Hostels
- `GET /api/hostels/hostels/` - List all hostels
- `GET /api/hostels/hostels/{id}/` - Get hostel details
- `GET /api/hostels/hostels/available/` - Get available hostels
- `GET /api/hostels/hostels/{id}/rooms/` - Get hostel rooms
- `GET /api/hostels/hostels/{id}/reviews/` - Get hostel reviews
- `POST /api/hostels/hostels/{id}/add_review/` - Add review (authenticated)

### Users
- `GET /api/users/users/` - List users (admin only)
- `GET /api/users/users/profile/` - Get current user profile
- `PUT /api/users/users/profile/` - Update user profile
- `POST /api/users/users/change_password/` - Change password

### Reservations
- `GET /api/reservations/reservations/` - List reservations
- `POST /api/reservations/reservations/` - Create reservation
- `GET /api/reservations/reservations/my_reservations/` - My reservations
- `POST /api/reservations/reservations/{id}/confirm/` - Confirm reservation (admin)
- `POST /api/reservations/reservations/{id}/cancel/` - Cancel reservation

### Inquiries
- `GET /api/reservations/inquiries/` - List inquiries
- `POST /api/reservations/inquiries/` - Create inquiry
- `POST /api/reservations/inquiries/{id}/respond/` - Respond to inquiry (admin)

## Default Credentials

After running the seed data command:

**Admin User:**
- Username: `admin`
- Password: `admin123`
- Phone: `+256700000000`

**Student User:**
- Username: `student1`
- Password: `student123`
- Phone: `+256712345678`

## Models

### User Model
- Custom user model with role-based access
- Fields: phone, email, country_code, role, gender, etc.

### Hostel Model
- Hostel information with ratings and reviews
- Fields: name, type, gender, rating, facilities, etc.

### Reservation Model
- Booking system with payment tracking
- Fields: user, hostel, status, payment_status, etc.

### Inquiry Model
- Student inquiry management
- Fields: name, email, subject, message, status, etc.

## Development

### Running Tests
```bash
python manage.py test
```

### Creating New Migrations
```bash
python manage.py makemigrations
```

### Django Admin
Access the admin panel at `http://localhost:8000/admin/`

### API Documentation
The API follows REST conventions and uses Django REST Framework.

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

### CORS Settings
The backend is configured to allow requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5500`
- `http://127.0.0.1:5500`

## Deployment

### Production Settings
1. Set `DEBUG = False` in settings.py
2. Configure production database
3. Set up proper `SECRET_KEY`
4. Configure static files serving
5. Set up proper CORS origins

### Build Static Files
```bash
python manage.py collectstatic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Bugema University Hostel Reservation System.
