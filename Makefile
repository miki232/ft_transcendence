# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: mtoia <mtoia@student.42roma.it>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/29 11:10:40 by mtoia             #+#    #+#              #
#    Updated: 2024/06/29 11:52:12 by mtoia            ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# Directory to store the generated SSL certificate and key
SSL_DIR=./transcendence/ssl

ENV_FILE=./.env

# Original certificate and key filenames
ORIG_CERT_NAME=nginx.crt
ORIG_KEY_NAME=nginx.key

# New certificate and key filenames for .pem
PEM_CERT_NAME=certcert.pem
PEM_KEY_NAME=certkey.pem


# Generate self-signed SSL certificate and key, and create .pem versions
ssl-certificate:
	@mkdir -p $(SSL_DIR)
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $(SSL_DIR)/$(ORIG_KEY_NAME) -out $(SSL_DIR)/$(ORIG_CERT_NAME) -subj "/C=IT/ST=Rome/L=Rome/O=800A"
	# Copy the original .crt and .key files to .pem files
	@cp $(SSL_DIR)/$(ORIG_CERT_NAME) $(SSL_DIR)/$(PEM_CERT_NAME)
	@cp $(SSL_DIR)/$(ORIG_KEY_NAME) $(SSL_DIR)/$(PEM_KEY_NAME)

generate-env:
	@echo "Generating .env file with dynamic Django SECRET_KEY..."
	@echo "POSTGRES_NAME='postgres'" > $(ENV_FILE)
	@echo "POSTGRES_USER='postgres'" >> $(ENV_FILE)
	@echo "POSTGRES_PASSWORD='mypassword'" >> $(ENV_FILE)
	@echo "POSTGRES_HOST='my-postgres'\n" >> $(ENV_FILE)
	@echo "SECRET_KEY='django-insecure-$$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-50)'\n" >> $(ENV_FILE)
	@echo "CSRF_TRUSTED_ORIGINS=https://127.0.0.1:8443\n" >> $(ENV_FILE)
	@echo "HOST=https://127.0.0.1:8443" >> $(ENV_FILE)
	@echo "42_CLIENT_ID='MAKE_YOUR_OWN'" >> $(ENV_FILE)
	@echo "42_CLIENT_SECRET='MAKE_YOUR_OWN'" >> $(ENV_FILE)
	@echo "42_SCOPE='public'" >> $(ENV_FILE)
	@echo ".env file has been generated."


.PHONY: ssl-certificate generate-env