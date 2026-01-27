# AACMA Backend Setup Instructions

## Prerequisites
- Python 3.8+ installed
- pip package manager

## Installation Steps

1. **Navigate to the backend directory:**
   ```bash
   cd aacma_backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   If you encounter network issues, try:
   ```bash
   pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
   ```

3. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Seed initial data (roles, zones, admin user):**
   ```bash
   python manage.py seed_data
   ```
   
   This creates:
   - All system roles (Directorate, Supervisor, Admin, IT, Audit, Analytics, Company Manager, Driver, Resident)
   - All Addis Ababa zones (Bole, Kirkos, Yeka, etc.)
   - Admin user: username `admin`, password `admin1234`, email `admin@example.com`

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

   The API will be available at: `http://localhost:8000`
   - API Documentation (Swagger): `http://localhost:8000/api/docs/swagger/`
   - API Documentation (ReDoc): `http://localhost:8000/api/docs/redoc/`
   - Admin Panel: `http://localhost:8000/admin/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new resident
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user profile
- `PUT /api/auth/me/` - Update current user profile

### Central Authority
- `GET /api/central/dashboard/` - Dashboard statistics
- `GET /api/central/users/` - List all users (Admin only)
- `GET /api/central/companies/` - List all companies
- `GET /api/central/complaints/` - View all complaints
- `GET /api/central/reports/` - View reports

### Resident
- `GET /api/collections/resident/requests/` - My collection requests
- `POST /api/collections/resident/requests/` - Create new request
- `GET /api/complaints/resident/complaints/` - My complaints

### Company
- `GET /api/company/dashboard/` - Company dashboard
- `GET /api/fleet/vehicles/` - Company vehicles
- `GET /api/fleet/drivers/` - Company drivers
- `GET /api/routes/` - Company routes

### Driver
- `GET /api/driver/profile/` - Driver profile
- `GET /api/driver/assignments/` - Today's assignments
- `GET /api/driver/route/` - Current route

## Default Admin Credentials
- Username: `admin`
- Password: `admin1234`
- Email: `admin@example.com`

## Troubleshooting

### If pip install fails:
1. Check your internet connection
2. Try: `pip install --upgrade pip`
3. Try: `pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt`
4. Check if you're behind a corporate firewall/proxy

### If migrations fail:
- Make sure all `__init__.py` files are present in all app directories
- Check that all models are properly defined

### If server won't start:
- Check that port 8000 is not in use
- Try: `python manage.py runserver 8001` to use a different port
