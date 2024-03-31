#!/bin/bash

# Open a new terminal and run the first command
gnome-terminal -- bash -c "daphne -e ssl:8000:privateKey=certkey.pem:certKey=certcert.pem django_progect.asgi:application; exec bash"

# Open another terminal and run the second command
gnome-terminal -- bash -c "python manage.py runsslserver --certificate ./certcert.pem --key ./certkey.pem 0.0.0.0:8001; exec bash"