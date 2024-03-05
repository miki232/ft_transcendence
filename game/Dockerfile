FROM python:3

# Install Python and pi

WORKDIR /usr/src/app

# Install Python dependencies
COPY requirements.txt .

RUN pip3 install --no-cache -r requirements.txt

# Copy the source code


COPY ./mysite ./prova

# Run the application
# CMD ["python3", "prova/manage.py", "runserver", "127.0.0.1:8080"]
EXPOSE 8080