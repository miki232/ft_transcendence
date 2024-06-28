#!/bin/bash
python manage.py makemigrations
python manage.py migrate
echo "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
" | python manage.py shell
python manage.py createai 4
python manage.py runserver 0.0.0.0:8001
# python manage.py runsslserver --certificate ./ssl/certcert.pem --key ./ssl/certkey.pem 0.0.0.0:8001