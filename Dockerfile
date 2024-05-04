# Use the official Python base image
FROM python:3.10.14

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
# COPY . ./

# Install Gunicorn
RUN pip install gunicorn

# RUN python manage.py collectstatic --noinput
# RUN python manage.py makemigrations && python manage.py migrate

EXPOSE 8001

# Set the command to run the Django web app with Gunicorn
# CMD ["gunicorn", "django_progect.wsgi:application", "--bind", "0.0.0.0:8000"]