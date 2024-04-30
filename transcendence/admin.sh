#!/bin/bash

python manage.py migrate
echo "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
" | python manage.py shell

python manage.py runserver 0.0.0.0:8001