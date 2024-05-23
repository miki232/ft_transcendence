#!/bin/bash

# Prompt for SSH connection details
read -p "Enter the SSH connection (user@host): " ssh_connection
read -s -p "Enter the SSH password: " ssh_password
echo

# Prompt for file to copy
read -p "Enter the local file path to copy: " local_file

# Prompt for port number
read -p "Enter the SSH port number (default: 22): " ssh_port
ssh_port=${ssh_port:-22}

# Copy the file via SCP
scp -P "$ssh_port" "$local_file" "$ssh_connection:"

# Extract the file name from the local file path
file_name=$(basename "$local_file")
file_name_without_ext="${file_name%.*}"

# Connect to the remote server via SSH
ssh -p "$ssh_port" "$ssh_connection" << EOF
# Set the password for the SSH session
$ssh_password

# Unzip the file
unzip "$file_name"

# Change directory to the extracted folder
cd "$file_name_without_ext"

# Install Python requirements
pip install -r requirements.txt

# Start Docker Compose
sudo docker-compose up -d
EOF

echo "Done!"