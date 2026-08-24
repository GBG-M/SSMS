# accounts/management/commands/seed_roles.py
from django.core.management.base import BaseCommand
from accounts.models import Role

class Command(BaseCommand):
    help = 'Seed initial roles'

    def handle(self, *args, **options):
        roles = [
            {'name': Role.ADMIN, 'description': 'System Administrator'},
            {'name': Role.ACADEMIC_COORDINATOR, 'description': 'Academic Coordinator'},
            {'name': Role.TEACHER, 'description': 'Teacher/Instructor'},
            {'name': Role.STUDENT, 'description': 'Student'},
            {'name': Role.PARENT, 'description': 'Parent/Guardian'},
        ]
        
        for role_data in roles:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created role: {role.name}'))
            else:
                self.stdout.write(f'Role already exists: {role.name}')
        
        self.stdout.write(self.style.SUCCESS('Roles seeded successfully!'))
        