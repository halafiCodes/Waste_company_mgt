from datetime import date, timedelta, time

from django.core.management.base import BaseCommand

from accounts.models import Role, User
from companies.models import WasteCompany
from fleet.models import Vehicle, Driver
from routes.models import Route
from zones.models import Zone
from waste_collections.models import CollectionRequest


class Command(BaseCommand):
    help = "Seed sample data for a Waste Company (vehicles, drivers, routes, requests)."

    def handle(self, *args, **options):
        company_role = Role.objects.filter(slug="company_manager").first()
        driver_role = Role.objects.filter(slug="driver").first()
        resident_role = Role.objects.filter(slug="resident").first()

        if not (company_role and driver_role and resident_role):
            self.stdout.write(self.style.ERROR("Run seed_data first to create base roles."))
            return

        zone, _ = Zone.objects.get_or_create(name="Bole", defaults={"code": "BOL"})

        company, _ = WasteCompany.objects.get_or_create(
            license_number="LIC-2024-001",
            defaults={
                "name": "Green Clean Services",
                "contact_email": "contact@greenclean.et",
                "contact_phone": "+251111234567",
                "address": "Bole, Addis Ababa",
                "status": "approved",
                "fleet_size": 0,
                "employee_count": 0,
            },
        )
        company.assigned_zones.add(zone)

        manager, created_manager = User.objects.get_or_create(
            username="company_admin",
            defaults={
                "email": "manager@greenclean.et",
                "first_name": "Mulu",
                "last_name": "Gebremedhin",
                "phone": "+251911223344",
                "user_type": "waste_company",
                "role": company_role,
            },
        )
        manager.role = company_role
        manager.user_type = "waste_company"
        if created_manager or not manager.has_usable_password():
            manager.set_password("Paassword@2029")
        manager.save()

        vehicles_data = [
            {
                "plate_number": "AA-12345",
                "vehicle_type": "compactor",
                "capacity_kg": 8000,
                "current_status": "active",
            },
            {
                "plate_number": "AA-54321",
                "vehicle_type": "rear_loader",
                "capacity_kg": 6500,
                "current_status": "maintenance",
            },
            {
                "plate_number": "AA-67890",
                "vehicle_type": "side_loader",
                "capacity_kg": 7000,
                "current_status": "inactive",
            },
        ]

        vehicles = []
        for data in vehicles_data:
            vehicle, _ = Vehicle.objects.get_or_create(
                plate_number=data["plate_number"],
                defaults={**data, "company": company},
            )
            vehicles.append(vehicle)

        drivers_seed = [
            {
                "username": "driver_one",
                "email": "driver1@greenclean.et",
                "first_name": "Amanuel",
                "last_name": "Tesfaye",
                "license_number": "DL-1001",
                "status": "on_duty",
            },
            {
                "username": "driver_two",
                "email": "driver2@greenclean.et",
                "first_name": "Hana",
                "last_name": "Bekele",
                "license_number": "DL-1002",
                "status": "off_duty",
            },
        ]

        drivers = []
        for idx, d in enumerate(drivers_seed):
            user, created_user = User.objects.get_or_create(
                username=d["username"],
                defaults={
                    "email": d["email"],
                    "first_name": d["first_name"],
                    "last_name": d["last_name"],
                    "user_type": "waste_company",
                    "role": driver_role,
                    "phone": "+251900000000",
                },
            )
            user.role = driver_role
            user.user_type = "waste_company"
            if created_user or not user.has_usable_password():
                user.set_password("Driver@2029")
            user.save()

            driver, _ = Driver.objects.get_or_create(
                user=user,
                defaults={
                    "license_number": d["license_number"],
                    "license_expiry": date.today() + timedelta(days=365),
                    "company": company,
                    "assigned_vehicle": vehicles[idx % len(vehicles)],
                    "current_status": d["status"],
                },
            )
            drivers.append(driver)

        today = date.today()
        routes_seed = [
            {
                "name": "Bole Morning Route",
                "status": "scheduled",
                "vehicle": vehicles[0],
                "driver": drivers[0],
                "scheduled_time": time(8, 0),
                "total_stops": 5,
                "completed_stops": 2,
            },
            {
                "name": "Bole Evening Route",
                "status": "in_progress",
                "vehicle": vehicles[1],
                "driver": drivers[1],
                "scheduled_time": time(18, 0),
                "total_stops": 6,
                "completed_stops": 3,
            },
        ]

        for r in routes_seed:
            Route.objects.update_or_create(
                name=r["name"],
                defaults={
                    "company": company,
                    "zone": zone,
                    "assigned_vehicle": r["vehicle"],
                    "assigned_driver": r["driver"],
                    "status": r["status"],
                    "scheduled_date": today,
                    "scheduled_start_time": r["scheduled_time"],
                    "total_stops": r["total_stops"],
                    "completed_stops": r["completed_stops"],
                },
            )

        resident_user, created_resident = User.objects.get_or_create(
            username="resident_demo",
            defaults={
                "email": "resident@example.com",
                "first_name": "Liya",
                "last_name": "Kebede",
                "user_type": "resident",
                "role": resident_role,
                "phone": "+251933334444",
            },
        )
        resident_user.role = resident_role
        resident_user.user_type = "resident"
        if created_resident or not resident_user.has_usable_password():
            resident_user.set_password("Resident@2029")
        resident_user.save()

        requests_seed = [
            {
                "waste_type": "general",
                "quantity_bags": 3,
                "preferred_time": "morning",
                "status": "pending",
                "address": "Bole 24, Addis Ababa",
            },
            {
                "waste_type": "recyclable",
                "quantity_bags": 2,
                "preferred_time": "afternoon",
                "status": "assigned",
                "address": "Bole Japan Embassy",
                "assigned_vehicle": vehicles[0],
                "assigned_driver": drivers[0],
            },
        ]

        for req in requests_seed:
            CollectionRequest.objects.get_or_create(
                resident=resident_user,
                address=req["address"],
                preferred_date=today,
                defaults={
                    "waste_type": req["waste_type"],
                    "quantity_bags": req["quantity_bags"],
                    "preferred_time": req["preferred_time"],
                    "status": req["status"],
                    "assigned_company": company,
                    "assigned_vehicle": req.get("assigned_vehicle"),
                    "assigned_driver": req.get("assigned_driver"),
                },
            )

        company.fleet_size = Vehicle.objects.filter(company=company).count()
        company.employee_count = Driver.objects.filter(company=company).count() + 1
        company.save()

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded waste company sample data. Login as company_admin / Paassword@2029"
            )
        )
