# Use the official Python base image
FROM python:3.10.14

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the requirements
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install django-environ

# Copy the rest of the application code into the container
# COPY . ./
COPY wait_for_it.sh ../sh/
COPY admin.sh ../sh/
RUN chmod 7777 ../sh/wait_for_it.sh
RUN chmod 7777 ../sh/admin.sh


# Install Gunicorn

# RUN python manage.py collectstatic --noinput
# RUN python manage.py makemigrations && python manage.py migrate


EXPOSE 8001

# Set the command to run the Django web app with Gunicorn
# CMD ["gunicorn", "django_progect.wsgi:application", "--bind", "0.0.0.0:8000"]