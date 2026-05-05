@echo off
echo Starting BU Hostel Reservation System...
echo.

echo [1/4] Starting Backend Server...
cd /d "c:\Users\hp\Desktop\bu hostel reservation\backend"
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
python manage.py migrate >nul 2>&1

echo Backend starting on http://localhost:8000
start "Backend Server" cmd /k "python manage.py runserver"

echo [2/4] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Frontend Server...
cd /d "c:\Users\hp\Desktop\bu hostel reservation\frontend"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo Frontend starting on http://localhost:5173
start "Frontend Server" cmd /k "npm run dev"

echo [4/4] Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo    BU HOSTEL RESERVATION SYSTEM
echo ========================================
echo.
echo Opening your application...
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin/
echo.

start http://localhost:5173

echo System is ready! Your browser should open automatically.
echo If not, manually open: http://localhost:5173
echo.
pause
