# Use the official Nginx base image
FROM nginx

# Copy custom configuration file to Nginx container
COPY conf.conf /etc/nginx/conf.d/default.conf


# Expose port 443 for HTTPS traffic
EXPOSE 443

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]