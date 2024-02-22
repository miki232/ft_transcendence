FROM alpine:3.7

# Install Python and pip
RUN apk add --no-cache python3 && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade pip setuptools

WORKDIR /usr/src/app

# Install Python dependencies
COPY requirements.txt .

RUN pip3 install --no-cache -r requirements.txt

# Copy the source code

EXPOSE 8000

COPY ./prova ./prova

# Run the application
# CMD ["python3", "prova/manage.py", "runserver", "0.0.0.0:8000"]