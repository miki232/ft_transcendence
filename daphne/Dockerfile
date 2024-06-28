# Use an official Python runtime as a parent image
FROM python:3.10.14

# Set the working directory in the container to /app
WORKDIR /app

# Add the current directory contents into the container at /app

COPY requirements.txt .
# Install any needed packages specified in requirements.txt
RUN pip install django-environ
RUN pip install --no-cache-dir -r requirements.txt

# Make port 8000 available to the world outside this container
EXPOSE 8000
ENV DJANGO_LOG_LEVEL=DEBUG
# Run daphne when the container launches
CMD ["daphne", "-e", "ssl:8000:privateKey=/app/ssl/certkey.pem:certKey=/app/ssl/certcert.pem", "django_progect.asgi:application"]
