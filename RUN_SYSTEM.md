# BU Hostel Reservation System - Running Guide

## Prerequisites

1. **Python** (3.8+) installed
2. **Node.js** (16+) and **npm** installed
3. **Git** (for version control)

## Initial Setup

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Create superuser (optional, for admin access)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the System

### Option 1: Run Both Services (Recommended)

**Open TWO separate terminal windows:**

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver
```
Backend will run on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173 (or similar Vite port)

### Option 2: Quick Start Commands

**For Windows PowerShell:**
```powershell
# Backend (in one terminal)
cd "c:\Users\hp\Desktop\bu hostel reservation\backend"
venv\Scripts\activate
python manage.py runserver

# Frontend (in another terminal)
cd "c:\Users\hp\Desktop\bu hostel reservation\frontend"
npm run dev
```

**For Command Prompt (cmd):**
```cmd
# Backend (in one terminal)
cd "c:\Users\hp\Desktop\bu hostel reservation\backend"
venv\Scripts\activate
python manage.py runserver

# Frontend (in another terminal)
cd "c:\Users\hp\Desktop\bu hostel reservation\frontend"
npm run dev
```

## Access Points

- **Frontend Application:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/

## API Endpoints Structure

The frontend is configured to proxy API requests to the backend:

- Frontend requests to `/api/*` → Backend at `http://localhost:8000/api/*`
- Authentication: `/api/auth/`
- Hostels: `/api/hostels/`
- Users: `/api/users/`
- Reservations: `/api/reservations/`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 8000 and 5173
   # Windows:
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **CORS Issues**
   - Ensure backend is running before frontend
   - Check that frontend port matches CORS settings in backend

3. **Database Issues**
   ```bash
   # Reset database
   cd backend
   python manage.py flush
   python manage.py migrate
   ```

4. **Module Not Found**
   ```bash
   # Backend - reinstall dependencies
   cd backend
   pip install -r requirements.txt
   
   # Frontend - reinstall node modules
   cd frontend
   rm -rf node_modules
   npm install
   ```

### Development Tips

1. **Backend Development Server**
   - Use `python manage.py runserver --settings=bu_hostel_backend.settings`
   - Add `--noreload` to disable auto-reload if needed

2. **Frontend Development**
   - Vite automatically reloads on file changes
   - Check console for any proxy errors

3. **Testing API Connection**
   - Visit http://localhost:8000/api/hostels/ to test backend
   - Check browser network tab for API calls

## Production Deployment Notes

For production, you'll need to:
1. Set `DEBUG = False` in backend settings
2. Configure proper database (PostgreSQL recommended)
3. Set up proper CORS origins
4. Build frontend: `npm run build`
5. Serve frontend static files through Django or separate web server

## System Architecture

```
Frontend (React + Vite)     Backend (Django + DRF)
       |                              |
   Port 5173                      Port 8000
       |                              |
   API Requests  ──→  Proxy  ──→  Django Views
       |                              |
   User Interface              Database (SQLite)
```
