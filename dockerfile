# Use a lightweight Nginx image specifically designed for serving web content.
# This is much smaller and more efficient for static sites than a full Ubuntu image.
FROM nginx:alpine

# Copy your custom Nginx configuration file into the container.
# This replaces the default Nginx configuration.
COPY nginx.conf /etc/nginx/nginx.conf

# Remove the default Nginx index.html file if it exists,
# to ensure your index.html is served instead.
# (This line is often not strictly necessary if you copy your files to the root,
# but it's good practice for clarity).
RUN rm -rf /usr/share/nginx/html/*

# Copy your application's static files (HTML, CSS, JS) into the Nginx default serving directory.
# This assumes index.html, styles.css, script.js are in the same directory as your Dockerfile.
COPY index.html styles.css script.js /usr/share/nginx/html/

# Expose port 80. This tells Docker that the container will listen on this port.
# Nginx is configured to listen on port 80 in the nginx.conf.
EXPOSE 80

# Define the command that runs when the container starts.
# This starts Nginx in the foreground so Docker can manage its lifecycle.
CMD ["nginx", "-g", "daemon off;"]