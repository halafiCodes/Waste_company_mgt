# Django Backend Development Prompt for AACMA Waste & Recycling Management System

Use this prompt with an AI assistant (Claude, ChatGPT, etc.) to generate a complete Django backend with SQLite.

---

## PROMPT START

Create a complete Django REST API backend for the **Addis Ababa Cleansing Management Agency (AACMA) Waste & Recycling Management System**. Use **Django 4.2+**, **Django REST Framework**, and **SQLite** database.

---

## PROJECT OVERVIEW

This is a multi-role web platform for managing waste collection and recycling in Addis Ababa. The system has three main user categories:
1. **Central Authority** - Government agency overseeing waste management (with 6 internal roles)
2. **Waste Company** - Private companies managing collection trucks and drivers
3. **Resident** - Citizens requesting waste collection and reporting issues

---

## MODELS TO CREATE

### 1. User & Authentication Models

```python
# accounts/models.py

class Role(models.Model):
    """
    System roles for all user types
    """
    ROLE_CHOICES = [
        # Central Authority internal roles
        ('directorate', 'Directorate'),
        ('supervisor', 'Supervisory Authority'),
        ('admin', 'System Administrator'),
        ('it', 'Technical/IT Authority'),
        ('audit', 'Audit & Compliance Authority'),
        ('analytics', 'Data & Analytics Authority'),
        # External roles
        ('company_manager', 'Waste Company Manager'),
        ('driver', 'Driver'),
        ('resident', 'Resident'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    level = models.CharField(max_length=50)  # e.g., "Strategic", "Operational"
    authority_type = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.JSONField(default=list)  # List of permission strings
    created_at = models.DateTimeField(auto_now_add=True)

class User(AbstractUser):
    """
    Custom User model supporting all user types
    """
    USER_TYPE_CHOICES = [
        ('central_authority', 'Central Authority'),
        ('waste_company', 'Waste Company'),
        ('resident', 'Resident'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    zone = models.ForeignKey('zones.Zone', on_delete=models.SET_NULL, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. Zone Management Models

```python
# zones/models.py

class Zone(models.Model):
    """
    Geographic zones/sub-cities of Addis Ababa
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)  # e.g., "Bole", "Kirkos", "Yeka"
    code = models.CharField(max_length=10, unique=True)
    boundaries = models.JSONField(null=True)  # GeoJSON for zone boundaries
    population_estimate = models.IntegerField(default=0)
    area_sqkm = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 3. Waste Company Models

```python
# companies/models.py

class WasteCompany(models.Model):
    """
    Registered waste management companies
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=50, unique=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_zones = models.ManyToManyField('zones.Zone', through='CompanyZoneAssignment')
    fleet_size = models.IntegerField(default=0)
    employee_count = models.IntegerField(default=0)
    registration_date = models.DateField(auto_now_add=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='approved_companies')
    approved_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CompanyZoneAssignment(models.Model):
    """
    Assignment of zones to waste companies
    """
    company = models.ForeignKey(WasteCompany, on_delete=models.CASCADE)
    zone = models.ForeignKey('zones.Zone', on_delete=models.CASCADE)
    assigned_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['company', 'zone']
```

### 4. Vehicle & Driver Models

```python
# fleet/models.py

class Vehicle(models.Model):
    """
    Waste collection vehicles/trucks
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]
    
    VEHICLE_TYPES = [
        ('compactor', 'Compactor Truck'),
        ('rear_loader', 'Rear Loader'),
        ('side_loader', 'Side Loader'),
        ('roll_off', 'Roll-Off Truck'),
    ]
    
    id = models.AutoField(primary_key=True)
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    capacity_kg = models.FloatField()
    company = models.ForeignKey('companies.WasteCompany', on_delete=models.CASCADE, related_name='vehicles')
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    last_location_lat = models.FloatField(null=True)
    last_location_lng = models.FloatField(null=True)
    last_location_update = models.DateTimeField(null=True)
    fuel_level = models.IntegerField(default=100)  # Percentage
    mileage = models.IntegerField(default=0)
    last_maintenance_date = models.DateField(null=True)
    next_maintenance_date = models.DateField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Driver(models.Model):
    """
    Waste collection truck drivers
    """
    STATUS_CHOICES = [
        ('on_duty', 'On Duty'),
        ('off_duty', 'Off Duty'),
        ('on_leave', 'On Leave'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    company = models.ForeignKey('companies.WasteCompany', on_delete=models.CASCADE, related_name='drivers')
    assigned_vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_driver')
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='off_duty')
    total_collections = models.IntegerField(default=0)
    rating = models.FloatField(default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 5. Route Models

```python
# routes/models.py

class Route(models.Model):
    """
    Collection routes with multiple stops
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    company = models.ForeignKey('companies.WasteCompany', on_delete=models.CASCADE, related_name='routes')
    zone = models.ForeignKey('zones.Zone', on_delete=models.CASCADE)
    assigned_vehicle = models.ForeignKey('fleet.Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    assigned_driver = models.ForeignKey('fleet.Driver', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    scheduled_date = models.DateField()
    scheduled_start_time = models.TimeField()
    actual_start_time = models.DateTimeField(null=True)
    actual_end_time = models.DateTimeField(null=True)
    total_stops = models.IntegerField(default=0)
    completed_stops = models.IntegerField(default=0)
    total_distance_km = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RouteStop(models.Model):
    """
    Individual stops along a route
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
    ]
    
    id = models.AutoField(primary_key=True)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    sequence_number = models.IntegerField()
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    resident = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    collection_request = models.ForeignKey('collections.CollectionRequest', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    arrival_time = models.DateTimeField(null=True)
    departure_time = models.DateTimeField(null=True)
    notes = models.TextField(blank=True)
```

### 6. Collection Request Models

```python
# collections/models.py

class CollectionRequest(models.Model):
    """
    Waste collection requests from residents
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    WASTE_TYPES = [
        ('general', 'General Waste'),
        ('recyclable', 'Recyclable'),
        ('hazardous', 'Hazardous'),
        ('organic', 'Organic/Compostable'),
        ('bulky', 'Bulky Items'),
    ]
    
    TIME_PREFERENCES = [
        ('morning', 'Morning (6AM-12PM)'),
        ('afternoon', 'Afternoon (12PM-6PM)'),
        ('evening', 'Evening (6PM-9PM)'),
    ]
    
    id = models.AutoField(primary_key=True)
    resident = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='collection_requests')
    waste_type = models.CharField(max_length=20, choices=WASTE_TYPES)
    quantity_bags = models.IntegerField(default=1)
    estimated_weight_kg = models.FloatField(null=True)
    preferred_date = models.DateField()
    preferred_time = models.CharField(max_length=20, choices=TIME_PREFERENCES)
    address = models.TextField()
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_company = models.ForeignKey('companies.WasteCompany', on_delete=models.SET_NULL, null=True, blank=True)
    assigned_vehicle = models.ForeignKey('fleet.Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    assigned_driver = models.ForeignKey('fleet.Driver', on_delete=models.SET_NULL, null=True, blank=True)
    estimated_arrival = models.DateTimeField(null=True)
    collected_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CollectionRecord(models.Model):
    """
    Record of completed waste collections (proof of service)
    """
    id = models.AutoField(primary_key=True)
    collection_request = models.OneToOneField(CollectionRequest, on_delete=models.CASCADE, related_name='record')
    vehicle = models.ForeignKey('fleet.Vehicle', on_delete=models.SET_NULL, null=True)
    driver = models.ForeignKey('fleet.Driver', on_delete=models.SET_NULL, null=True)
    collected_at = models.DateTimeField()
    actual_weight_kg = models.FloatField(null=True)
    photo_proof = models.ImageField(upload_to='collection_proofs/', null=True, blank=True)
    resident_signature = models.TextField(blank=True)  # Base64 encoded signature
    driver_notes = models.TextField(blank=True)
    rating = models.IntegerField(null=True)  # 1-5 rating from resident
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 7. Complaint & Emergency Models

```python
# complaints/models.py

class WasteReport(models.Model):
    """
    Complaints and emergency reports from residents
    """
    REPORT_TYPES = [
        ('missed_collection', 'Missed Collection'),
        ('late_pickup', 'Late Pickup'),
        ('service_quality', 'Service Quality Issue'),
        ('illegal_dumping', 'Illegal Dumping'),
        ('hazardous_spill', 'Hazardous Spill'),
        ('medical_waste', 'Medical Waste Emergency'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('escalated', 'Escalated'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('emergency', 'Emergency'),
    ]
    
    id = models.AutoField(primary_key=True)
    resident = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='waste_reports')
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    description = models.TextField()
    location_address = models.TextField()
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    photo_evidence = models.ImageField(upload_to='report_evidence/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_company = models.ForeignKey('companies.WasteCompany', on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    response = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ReportComment(models.Model):
    """
    Comments/updates on a waste report
    """
    id = models.AutoField(primary_key=True)
    report = models.ForeignKey(WasteReport, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    comment = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal notes vs resident-visible
    created_at = models.DateTimeField(auto_now_add=True)
```

### 8. Notification Models

```python
# notifications/models.py

class Notification(models.Model):
    """
    System notifications for all users
    """
    NOTIFICATION_TYPES = [
        ('collection_scheduled', 'Collection Scheduled'),
        ('collection_in_progress', 'Collection In Progress'),
        ('collection_completed', 'Collection Completed'),
        ('complaint_update', 'Complaint Update'),
        ('system_alert', 'System Alert'),
        ('company_approval', 'Company Approval'),
        ('assignment', 'New Assignment'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)  # Additional context data
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 9. Reporting & Analytics Models

```python
# reports/models.py

class PerformanceReport(models.Model):
    """
    Company performance reports
    """
    REPORT_PERIODS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    id = models.AutoField(primary_key=True)
    company = models.ForeignKey('companies.WasteCompany', on_delete=models.CASCADE, related_name='performance_reports')
    period = models.CharField(max_length=20, choices=REPORT_PERIODS)
    start_date = models.DateField()
    end_date = models.DateField()
    total_collections = models.IntegerField(default=0)
    completed_collections = models.IntegerField(default=0)
    missed_collections = models.IntegerField(default=0)
    average_response_time_hours = models.FloatField(default=0)
    total_waste_collected_kg = models.FloatField(default=0)
    recycled_waste_kg = models.FloatField(default=0)
    customer_satisfaction_rating = models.FloatField(default=0)
    complaints_received = models.IntegerField(default=0)
    complaints_resolved = models.IntegerField(default=0)
    generated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CityWideReport(models.Model):
    """
    City-wide analytics reports for Central Authority
    """
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    period_start = models.DateField()
    period_end = models.DateField()
    total_waste_generated_tons = models.FloatField(default=0)
    total_waste_collected_tons = models.FloatField(default=0)
    recycling_rate_percentage = models.FloatField(default=0)
    active_companies = models.IntegerField(default=0)
    active_vehicles = models.IntegerField(default=0)
    active_zones = models.IntegerField(default=0)
    total_requests = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0)
    average_response_time = models.FloatField(default=0)
    zone_breakdown = models.JSONField(default=dict)
    company_breakdown = models.JSONField(default=dict)
    generated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 10. Audit Log Models

```python
# audit/models.py

class AuditLog(models.Model):
    """
    System audit trail for compliance tracking
    """
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('assign', 'Assign'),
        ('escalate', 'Escalate'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    changes = models.JSONField(default=dict)  # Before/after values
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
```

---

## API ENDPOINTS TO CREATE

### Authentication APIs
```
POST   /api/auth/register/              # Register new user (Resident only via public)
POST   /api/auth/login/                 # Login and get JWT tokens
POST   /api/auth/logout/                # Logout and invalidate token
POST   /api/auth/refresh/               # Refresh access token
POST   /api/auth/password/reset/        # Request password reset
POST   /api/auth/password/confirm/      # Confirm password reset
GET    /api/auth/me/                    # Get current user profile
PUT    /api/auth/me/                    # Update current user profile
```

### Central Authority APIs (Role-based access)
```
# User Management (Admin role)
GET    /api/central/users/                    # List all users
POST   /api/central/users/                    # Create user
GET    /api/central/users/{id}/               # Get user details
PUT    /api/central/users/{id}/               # Update user
DELETE /api/central/users/{id}/               # Delete user
POST   /api/central/users/{id}/suspend/       # Suspend user
POST   /api/central/users/{id}/activate/      # Activate user

# Company Management (Directorate/Supervisor roles)
GET    /api/central/companies/                # List all companies
POST   /api/central/companies/                # Register new company
GET    /api/central/companies/{id}/           # Get company details
PUT    /api/central/companies/{id}/           # Update company
POST   /api/central/companies/{id}/approve/   # Approve company
POST   /api/central/companies/{id}/reject/    # Reject company
POST   /api/central/companies/{id}/suspend/   # Suspend company

# Zone Management (Directorate role)
GET    /api/central/zones/                    # List all zones
POST   /api/central/zones/                    # Create zone
GET    /api/central/zones/{id}/               # Get zone details
PUT    /api/central/zones/{id}/               # Update zone
POST   /api/central/zones/{id}/assign/        # Assign company to zone

# City-wide Monitoring (All Central Authority roles)
GET    /api/central/dashboard/                # Dashboard statistics
GET    /api/central/collections/              # Monitor all collections
GET    /api/central/complaints/               # View all complaints
POST   /api/central/complaints/{id}/respond/  # Respond to complaint
POST   /api/central/complaints/{id}/escalate/ # Escalate complaint

# Reports (Analytics/Directorate roles)
GET    /api/central/reports/                  # List reports
POST   /api/central/reports/generate/         # Generate new report
GET    /api/central/reports/{id}/             # Get report details
GET    /api/central/analytics/                # Get analytics data

# Audit Logs (Audit role - Read Only)
GET    /api/central/audit/logs/               # View audit logs
GET    /api/central/audit/logs/{id}/          # View specific log

# System Health (IT role)
GET    /api/central/system/health/            # System health check
GET    /api/central/system/metrics/           # System metrics
POST   /api/central/system/backup/            # Trigger backup
```

### Waste Company APIs
```
# Dashboard
GET    /api/company/dashboard/                # Company dashboard stats

# Fleet Management
GET    /api/company/vehicles/                 # List company vehicles
POST   /api/company/vehicles/                 # Add new vehicle
GET    /api/company/vehicles/{id}/            # Get vehicle details
PUT    /api/company/vehicles/{id}/            # Update vehicle
DELETE /api/company/vehicles/{id}/            # Remove vehicle
PUT    /api/company/vehicles/{id}/location/   # Update vehicle location
PUT    /api/company/vehicles/{id}/status/     # Update vehicle status

# Driver Management
GET    /api/company/drivers/                  # List company drivers
POST   /api/company/drivers/                  # Add new driver
GET    /api/company/drivers/{id}/             # Get driver details
PUT    /api/company/drivers/{id}/             # Update driver
DELETE /api/company/drivers/{id}/             # Remove driver
POST   /api/company/drivers/{id}/assign/      # Assign driver to vehicle

# Route Management
GET    /api/company/routes/                   # List routes
POST   /api/company/routes/                   # Create route
GET    /api/company/routes/{id}/              # Get route details
PUT    /api/company/routes/{id}/              # Update route
POST   /api/company/routes/{id}/start/        # Start route
POST   /api/company/routes/{id}/complete/     # Complete route
GET    /api/company/routes/{id}/stops/        # Get route stops
PUT    /api/company/routes/{id}/stops/{stop_id}/  # Update stop status

# Collection Requests
GET    /api/company/requests/                 # List pending requests
GET    /api/company/requests/{id}/            # Get request details
POST   /api/company/requests/{id}/assign/     # Assign request to driver
PUT    /api/company/requests/{id}/status/     # Update request status
POST   /api/company/requests/{id}/complete/   # Mark as completed

# Reports
GET    /api/company/reports/                  # List company reports
POST   /api/company/reports/submit/           # Submit report to authority
```

### Resident APIs
```
# Profile
GET    /api/resident/profile/                 # Get profile
PUT    /api/resident/profile/                 # Update profile

# Collection Requests
GET    /api/resident/requests/                # List my requests
POST   /api/resident/requests/                # Create new request
GET    /api/resident/requests/{id}/           # Get request details
PUT    /api/resident/requests/{id}/           # Update request
DELETE /api/resident/requests/{id}/           # Cancel request
GET    /api/resident/requests/{id}/track/     # Track pickup status

# Complaints
GET    /api/resident/complaints/              # List my complaints
POST   /api/resident/complaints/              # Submit new complaint
GET    /api/resident/complaints/{id}/         # Get complaint details

# Collection Schedule
GET    /api/resident/schedule/                # Get zone collection schedule

# Notifications
GET    /api/resident/notifications/           # List notifications
PUT    /api/resident/notifications/{id}/read/ # Mark as read
POST   /api/resident/notifications/read-all/  # Mark all as read

# History
GET    /api/resident/history/                 # Collection history
```

### Driver/Mobile APIs
```
GET    /api/driver/profile/                   # Get driver profile
GET    /api/driver/assignments/               # Get today's assignments
GET    /api/driver/route/                     # Get current route
POST   /api/driver/route/start/               # Start route
POST   /api/driver/route/stop/{id}/arrive/    # Mark arrival at stop
POST   /api/driver/route/stop/{id}/complete/  # Complete stop
POST   /api/driver/route/complete/            # Complete route
POST   /api/driver/location/                  # Update GPS location
POST   /api/driver/report-issue/              # Report issue
```

---

## SERIALIZERS TO CREATE

Create serializers for all models with:
- Nested serializers for related objects
- Read-only fields for computed values
- Validation for business rules
- Different serializers for list vs detail views

Example:
```python
class CollectionRequestSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CollectionRequest
        fields = '__all__'
        read_only_fields = ['id', 'resident', 'created_at', 'updated_at']
```

---

## PERMISSIONS TO IMPLEMENT

```python
# permissions.py

class IsCentralAuthority(BasePermission):
    """User must be Central Authority staff"""
    def has_permission(self, request, view):
        return request.user.user_type == 'central_authority'

class IsDirectorate(BasePermission):
    """User must have Directorate role (role_id=1)"""
    def has_permission(self, request, view):
        return request.user.role and request.user.role.slug == 'directorate'

class IsSupervisor(BasePermission):
    """User must have Supervisor role"""
    def has_permission(self, request, view):
        return request.user.role and request.user.role.slug == 'supervisor'

class IsAdmin(BasePermission):
    """User must have Admin role"""
    def has_permission(self, request, view):
        return request.user.role and request.user.role.slug == 'admin'

class IsAudit(BasePermission):
    """User must have Audit role - Read Only access"""
    def has_permission(self, request, view):
        if request.user.role and request.user.role.slug == 'audit':
            return request.method in SAFE_METHODS
        return False

class IsWasteCompany(BasePermission):
    """User must belong to a Waste Company"""
    def has_permission(self, request, view):
        return request.user.user_type == 'waste_company'

class IsResident(BasePermission):
    """User must be a Resident"""
    def has_permission(self, request, view):
        return request.user.user_type == 'resident'

class IsDriver(BasePermission):
    """User must be a Driver"""
    def has_permission(self, request, view):
        return hasattr(request.user, 'driver_profile')
```

---

## SEED DATA

Create a management command to seed initial data:

```python
# management/commands/seed_data.py

# 1. Roles
roles = [
    {"name": "Directorate", "slug": "directorate", "level": "Strategic", "authority_type": "Highest decision-making"},
    {"name": "Supervisory Authority", "slug": "supervisor", "level": "Oversight", "authority_type": "Monitoring and approval"},
    {"name": "System Administrator", "slug": "admin", "level": "Operational", "authority_type": "Execution and management"},
    {"name": "Technical/IT Authority", "slug": "it", "level": "Infrastructure", "authority_type": "Technical maintenance"},
    {"name": "Audit & Compliance", "slug": "audit", "level": "Independent", "authority_type": "Transparency"},
    {"name": "Data & Analytics", "slug": "analytics", "level": "Analytical", "authority_type": "Reporting"},
    {"name": "Company Manager", "slug": "company_manager", "level": "Operational", "authority_type": "Company operations"},
    {"name": "Driver", "slug": "driver", "level": "Field", "authority_type": "Collection operations"},
    {"name": "Resident", "slug": "resident", "level": "User", "authority_type": "Service consumer"},
]

# 2. Zones (Addis Ababa Sub-cities)
zones = [
    {"name": "Bole", "code": "BOL"},
    {"name": "Kirkos", "code": "KIR"},
    {"name": "Yeka", "code": "YEK"},
    {"name": "Arada", "code": "ARA"},
    {"name": "Addis Ketema", "code": "ADK"},
    {"name": "Lideta", "code": "LID"},
    {"name": "Kolfe Keranio", "code": "KOL"},
    {"name": "Gulele", "code": "GUL"},
    {"name": "Akaky Kaliti", "code": "AKA"},
    {"name": "Nifas Silk-Lafto", "code": "NSL"},
    {"name": "Lemi Kura", "code": "LEM"},
]

# 3. Sample Users for each role
# 4. Sample Waste Companies
# 5. Sample Vehicles and Drivers
# 6. Sample Collection Requests
# 7. Sample Complaints
```

---

## DJANGO SETTINGS

```python
# settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local apps
    'accounts',
    'zones',
    'companies',
    'fleet',
    'routes',
    'collections',
    'complaints',
    'notifications',
    'reports',
    'audit',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

AUTH_USER_MODEL = 'accounts.User'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js frontend
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

---

## PROJECT STRUCTURE

```
aacma_backend/
├── manage.py
├── aacma/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── permissions.py
├── zones/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── companies/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── fleet/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── routes/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── collections/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── complaints/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── notifications/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── reports/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── audit/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── requirements.txt
```

---

## REQUIREMENTS.TXT

```
Django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
django-filter>=23.5
Pillow>=10.0
python-dotenv>=1.0
```

---

## ADDITIONAL REQUIREMENTS

1. **Audit Logging Middleware**: Automatically log all API calls to the AuditLog model
2. **Notification Service**: Create signals to automatically create notifications on important events
3. **Report Generation**: Create async tasks for generating large reports
4. **GPS Location Validation**: Validate that locations are within Addis Ababa boundaries
5. **Rate Limiting**: Implement rate limiting for public endpoints
6. **API Documentation**: Generate OpenAPI/Swagger documentation

---

## PROMPT END

---

Copy everything between "PROMPT START" and "PROMPT END" and paste it into an AI assistant to generate your Django backend.
