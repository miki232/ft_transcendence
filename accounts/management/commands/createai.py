from django.core.management.base import BaseCommand
from ...models import CustomUser

class Command(BaseCommand):
    help = 'Create a specified number of AI users'

    def add_arguments(self, parser):
        parser.add_argument('total', type=int, help='Indicates the number of users to be created')

    def handle(self, *args, **kwargs):
        total = kwargs['total']
        for i in range(total):
            try:
                success = CustomUser.objects.create(username=f'ai_user_{i}', email=f'ai_user_{i}@ai.ai', Ai=True)
                self.stdout.write(self.style.SUCCESS(f'USER : {success.username} Created Successfully'))
            except Exception as e:
                user = CustomUser.objects.get(username=f'ai_user_{i}')
                self.stdout.write(self.style.ERROR(f'Error creating user: {e}'))
                self.stdout.write(self.style.WARNING(f'USER : {user.username} already exists'))
                continue
