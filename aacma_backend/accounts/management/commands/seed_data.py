from django.core.management.base import BaseCommand

from accounts.models import Role, User
from zones.models import Zone


class Command(BaseCommand):
    help = "Seed initial roles, zones, and sample data for AACMA."

    def handle(self, *args, **options):
        self.stdout.write("Seeding roles...")
        roles = [
            {
                "name": "Directorate",
                "slug": "directorate",
                "level": "Strategic",
                "authority_type": "Highest decision-making",
            },
            {
                "name": "Supervisory Authority",
                "slug": "supervisor",
                "level": "Oversight",
                "authority_type": "Monitoring and approval",
            },
            {
                "name": "System Administrator",
                "slug": "admin",
                "level": "Operational",
                "authority_type": "Execution and management",
            },
            {
                "name": "Technical/IT Authority",
                "slug": "it",
                "level": "Infrastructure",
                "authority_type": "Technical maintenance",
            },
            {
                "name": "Audit & Compliance",
                "slug": "audit",
                "level": "Independent",
                "authority_type": "Transparency",
            },
            {
                "name": "Data & Analytics",
                "slug": "analytics",
                "level": "Analytical",
                "authority_type": "Reporting",
            },
            {
                "name": "Company Manager",
                "slug": "company_manager",
                "level": "Operational",
                "authority_type": "Company operations",
            },
            {
                "name": "Driver",
                "slug": "driver",
                "level": "Field",
                "authority_type": "Collection operations",
            },
            {
                "name": "Resident",
                "slug": "resident",
                "level": "User",
                "authority_type": "Service consumer",
            },
        ]

        for r in roles:
            Role.objects.get_or_create(
                slug=r["slug"],
                defaults={
                    "name": r["name"],
                    "level": r["level"],
                    "authority_type": r["authority_type"],
                    "description": "",
                    "permissions": [],
                },
            )

        self.stdout.write("Seeding zones...")
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

        for z in zones:
            Zone.objects.get_or_create(name=z["name"], code=z["code"])

        self.stdout.write("Creating sample superuser (admin@example.com / admin1234)...")
        if not User.objects.filter(username="admin").exists():
            admin_role = Role.objects.filter(slug="admin").first()
            user = User.objects.create_superuser(
                username="admin",
                email="admin@example.com",
                password="admin1234",
                user_type="central_authority",
                phone="0000000000",
            )
            user.role = admin_role
            user.save()

        self.stdout.write(self.style.SUCCESS("Seed data created."))

