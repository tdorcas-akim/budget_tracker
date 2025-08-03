Budget Tracker Project Overview
"Budget Tracker" is a user-friendly web application designed to help users effectively manage their personal finances. It allows tracking income and expenses, setting monthly budget goals, and visualizing overall financial status. The application also includes a real-time currency conversion feature, offering a comprehensive tool for daily financial management.

Key Features
User Management: Sign-up, login, and password reset functionalities with local storage for user credentials.

Transaction Tracking: Add and delete transactions with details (description, amount, type (income/expense), category, date).

Financial Summary: Real-time display of total income, total expenses, and current balance.

Budget Management: Ability to set a monthly spending goal and track progress against it.

Transaction Filtering & Sorting: Filter transactions by type (income/expense) and category, and sort by date or amount.

Currency Converter: Convert amounts between different currencies using real-time exchange rates from external APIs.

Intuitive Interface: Clear and logical design for an enhanced user experience.

Error Handling: Robust error handling for user inputs and API calls.

External APIs Used
The application uses external APIs to provide real-time exchange rates for the currency converter feature:

Exchangerate-API (Primary API)

Documentation: https://www.exchangerate-api.com/

Currencyapi.com (Backup API)

Documentation: https://currencyapi.com/

Part 1: Local Implementation
The application is a frontend web application built with plain HTML, CSS, and JavaScript. It uses the browser's local storage (localStorage and sessionStorage) for user data and transaction persistence.

To run the application locally on your machine:

Clone the repository:

git clone https://github.com/tdorcas-akim/budget_tracker.git
cd budget_tracker

Open in Browser:

Simply open the index.html file in your preferred web browser.

Alternatively, you can use a simple local web server (like Live Server for VS Code, or python3 -m http.server in the project directory) to serve the files.

Part 2A: Deployment (Docker Containers + Docker Hub)
This section details the process of containerizing the application, publishing its image to Docker Hub, and deploying it on the provided lab environment (Web01, Web02, Lb01) with load balancing.

1. Application Containerization
The application is containerized using a Dockerfile that includes Nginx to serve the static files (HTML, CSS, JavaScript).

dockerfile:

# Use a lightweight Nginx image specifically designed for serving web content.
# This is much smaller and more efficient for static sites than a full Ubuntu image.
FROM nginx:alpine

# Copy your custom Nginx configuration file into the container.
# This replaces the default Nginx configuration.
COPY nginx.conf /etc/nginx/nginx.conf

# Remove the default Nginx index.html file if it exists,
# to ensure your index.html is served instead.
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

2. Build and Test Docker Image Locally
Build your application's Docker image and test it locally to ensure it works as expected.

docker build -t tdorcas/budget_tracker:latest .

# Run the container, mapping host port 8080 to container port 80
docker run -d --name budget-tracker-local -p 8080:80 tdorcas/budget_tracker:latest

# Verify the application is accessible locally
curl http://localhost:8080
# Or open http://localhost:8080 in your web browser.

3. Publish to Docker Hub
Once the image works locally, push it to your Docker Hub repository to make it accessible to the lab machines.

docker login
# Enter your Docker Hub credentials

# Push the image to Docker Hub
docker push tdorcas/budget_tracker:latest

4. Deployment on Lab Machines (web-01 and web-02)
The web-01 and web-02 containers are provided by the lab environment. We will deploy instances of your application within them.

Connect to web-01 via SSH:

ssh ubuntu@localhost -p 2211

Password: pass123

Inside web-01 (after connecting):

# Pull your application's Docker image
docker pull tdorcas/budget_tracker:latest

# Run the application. Nginx is already included in the image.
# Container port 80 is exposed for the internal lablan network.
docker run -d --name app --restart unless-stopped -p 80:80 tdorcas/budget_tracker:latest

# Exit the web-01 container
exit

Connect to web-02 via SSH:

ssh ubuntu@localhost -p 2212

Password: pass123

Inside web-02 (after connecting):

# Pull your application's Docker image
docker pull tdorcas/budget_tracker:latest

# Run the application. Nginx is already included in the image.
# Container port 80 is exposed for the internal lablan network.
docker run -d --name app --restart unless-stopped -p 80:80 tdorcas/budget_tracker:latest

# Exit the web-02 container
exit

5. Load Balancer Configuration (lb-01)
The lb-01 container is configured with HAProxy to distribute traffic between web-01 and web-02 using the roundrobin algorithm.

Get the current internal IP addresses of web-01 and web-02 on the lablan network:

In your main WSL terminal:

docker inspect -f '{{.NetworkSettings.Networks.lablan.IPAddress}}' web-01
docker inspect -f '{{.NetworkSettings.Networks.lablan.IPAddress}}' web-02

Note these IPs (they might change after a Docker restart). For this example, we will use 172.20.0.2 and 172.20.0.3 as observed previously.

Connect to lb-01 via SSH:

ssh ubuntu@localhost -p 2210

Password: pass123

Install HAProxy (if not already installed):

sudo apt update && sudo apt install -y haproxy

Modify the HAProxy configuration file (/etc/haproxy/haproxy.cfg):

Open the file: sudo nano /etc/haproxy/haproxy.cfg

Replace the existing frontend and backend sections with the following snippet, making sure to use the exact IP addresses for web-01 and web-02 that you obtained in step 1.

# Main HAProxy configuration for load balancing
global
    daemon
    maxconn 256

defaults
    mode http
    timeout connect 5s      # Max time to establish a connection to a backend server
    timeout client  50s     # Max client inactivity time
    timeout server  50s     # Max backend server inactivity time

# Frontend for public HTTP traffic (port 8082 on host)
frontend http-in
    bind *:80           # Listens on port 80 inside the lb-01 container
    default_backend webapps

# Backend for application web servers
backend webapps
    balance roundrobin  # Load balancing algorithm (round-robin)
    # Backend web servers (replace IPs with those obtained via docker inspect)
    server web01 172.20.0.2:80 check inter 5s rise 2 fall 3
    server web02 172.20.0.3:80 check inter 5s rise 2 fall 3
    # Adds a custom header to indicate which server handled the request
    http-response set-header X-Served-By %[srv_name]

# Section for HAProxy statistics page (port 8083 on host)
listen stats
    bind *:8083
    stats enable
    stats uri /haproxy?stats
    stats auth admin:password # Username and password to access stats
    stats refresh 5s

Save and exit nano (Ctrl+O, Enter, Ctrl+X).

Restart HAProxy to apply the new configuration:

sudo service haproxy restart

Exit the lb-01 container:

exit

6. End-to-End Testing and Load Balancing Proof
After configuring HAProxy, verify that traffic is correctly balanced between the web servers.

Test the Load Balancer from your host machine:

In your main WSL terminal, run the curl command multiple times:

curl -I http://localhost:8082

Proof (Logs): You should observe HTTP/1.1 200 OK responses and the X-Served-By header alternating between web01 and web02, proving load balancing.

# Example expected output (alternating X-Served-By)
HTTP/1.1 200 OK
...
X-Served-By: web02

HTTP/1.1 200 OK
...
X-Served-By: web01

(Include a screenshot of your terminal showing this alternation in your submission.)

Check the HAProxy statistics page in your browser:

Open your web browser and go to: http://localhost:8083/haproxy?stats

Log in with admin / password credentials.

Proof (Screenshot): The statistics page will show the status of your backend servers (web01 and web02), active sessions, and request counters, confirming that HAProxy is active and interacting with the servers.

API Key Management (Hardening - Optional)
For a production application, it is crucial not to embed API keys directly into client-side code (as is the case for the Currencyapi.com API in script.js). More secure approaches include:

Environment Variables: Store the API key in an environment variable on the server where the application is deployed, and load it at application startup.

Backend Proxy Service: Create a small backend service that handles calls to the external API. The frontend application would then make requests to this backend service, which would securely add the API key before forwarding the request to the external API. This hides the API key from the client.

Deliverables
GitHub Repository Link: https://github.com/tdorcas-akim/budget_tracker.git

Ensure the repository contains all source files (index.html, styles.css, script.js, nginx.conf, dockerfile) and a .gitignore file to exclude unnecessary or sensitive files.

Demo Video Link: 

Credits

Exchange Rate APIs: Exchangerate-API and Currencyapi.com

Lab Infrastructure provided by: waka-man/web_infra_lab

=======
# Web Infrastructure Lab

This repository provides a lightweight environment to demonstrate web server setup and basic load balancing using Docker containers. The stack consists of two web servers (`web-01` and `web-02`) and a load balancer (`lb-01`) connected to a custom Docker network. Each service runs Ubuntu 24.04 with SSH enabled to allow you to install and configure additional software.

## Requirements

- Docker and Docker Compose installed on your machine
- At least 2 GB of free RAM and a few hundred megabytes of disk space

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd web_infra_lab
   ```
2. Bring up the lab environment (builds the images on first run):
   ```bash
   docker compose up -d --build
   ```
3. Verify that the containers are running:
   ```bash
   docker compose ps
   ```
   You should see `web-01`, `web-02`, and `lb-01` online. The services are attached to the `lablan` network with the following addresses:

   | Container | IP           | Exposed Ports |
   |---------- |------------- |---------------|
   | web-01    | 172.20.0.11  | 2211 (SSH), 8080 (HTTP) |
   | web-02    | 172.20.0.12  | 2212 (SSH), 8081 (HTTP) |
   | lb-01     | 172.20.0.10  | 2210 (SSH), 8082 (HTTP) |

4. Connect to each container using SSH if you prefer an interactive terminal. All containers include an `ubuntu` user with the password `pass123`.
   ```bash
   ssh ubuntu@localhost -p 2211  # web-01
   ssh ubuntu@localhost -p 2212  # web-02
   ssh ubuntu@localhost -p 2210  # lb-01
   ```

## Nginx Setup on `web-01` and `web-02`

Within each `web-*` container install Nginx and host a small static site. For example:

```bash
sudo apt update && sudo apt install -y nginx
sudo bash -c 'echo "<h1>web-01</h1>" > /var/www/html/index.html'
```

Repeat for `web-02`, modifying the page content so you can tell the two servers apart. After starting Nginx (`sudo systemctl restart nginx`), visit the host ports http://localhost:8080 and http://localhost:8081 to verify the pages load.

## Activity – Configure HAProxy on `lb-01`

Your task is to configure HAProxy on `lb-01` to load balance requests between `web-01` and `web-02` using the **roundrobin** algorithm. Additionally, each response must include a custom header `X-Served-By` indicating which backend served the request.

Steps to complete the activity:

1. Install HAProxy inside `lb-01`:
   ```bash
   sudo apt update && sudo apt install -y haproxy
   ```
2. Edit `/etc/haproxy/haproxy.cfg` so that the frontend listens on port `80` and forwards to the two backends. Example snippet:
   ```
   global
       daemon
       maxconn 256

   defaults
       mode http
       timeout connect 5s
       timeout client  50s
       timeout server  50s

   frontend http-in
       bind *:80
       default_backend servers

   backend servers
       balance roundrobin
       server web01 172.20.0.11:80 check
       server web02 172.20.0.12:80 check
       http-response set-header X-Served-By %[srv_name]
   ```
3. Restart HAProxy to apply your configuration:
   ```bash
   sudo systemctl restart haproxy
   ```

### Verifying the Load Balancer

From your host machine run:
```bash
curl -I http://localhost:8082
```
Repeated requests should alternate between `web-01` and `web-02` and the `X-Served-By` header in the output will reveal which server handled each request.

Feel free to experiment with the configuration and explore additional features of HAProxy. When you are finished with the lab environment, shut it down with:
```bash
docker compose down
```

Enjoy your lightweight web infrastructure lab!
>>>>>>> master
