My Project: Budget Tracker
This project is a small web application I built to help anyone manage their money better. The idea is simple: track what you earn and spend, set budget goals, and get a clear picture of your finances. I even added a real-time currency converter, which is super handy for daily use!

What the App Can Do
User Management: You can sign up, log in, and even reset your password. All your info is securely saved in your browser.

Transaction Tracking: Easily add your income and expenses (with a description, amount, type, category, and date). You can also delete transactions if you make a mistake.

Financial Summary: The app shows your total income, total expenses, and current balance in real-time.

Budget Management: Set a monthly spending goal and track your progress against it.

Filter and Sort: You can easily filter your transactions by type or category, and sort them by date or amount, making it simple to interact with your data.

Currency Converter: Convert amounts between different currencies using live exchange rates.

Simple Interface: I designed the app to be easy to use, with a clean layout.

Error Handling: The app handles issues gracefully, for example, if you enter bad information or if the currency services are down.

External Services I Use
My application connects to external services to get real-time exchange rates for the currency converter feature:

Exchangerate-API (my primary choice)

Documentation: https://www.exchangerate-api.com/

Currencyapi.com (as a backup)

Documentation: https://currencyapi.com/

Part 1: Running the App on Your Computer
If you just want to test the application on your own computer, it's super straightforward:

Get the project:

git clone https://github.com/tdorcas-akim/budget_tracker.git
cd budget_tracker

Open it in your browser:
Just open the index.html file with your favorite web browser.
Alternatively, you can use a simple local web server (like "Live Server" if you use VS Code, or python3 -m http.server in the project folder) to serve the files.

Part 2: Deployment with Docker Compose
I've set up my application to be easily deployed with Docker, and I even added a load balancer to handle traffic. Here's how I did it and how you can run it yourself.

My Docker Files
1. Dockerfile (for the application): This file tells Docker how to build the image for my "Budget Tracker" app. It uses Nginx to serve my website files (HTML, CSS, JavaScript).

2. lb/Dockerfile.lb (for the load balancer): This Dockerfile is specifically for my load balancer. It installs HAProxy and configures it to be ready to distribute traffic.

3. lb/haproxy.cfg (the HAProxy configuration): This is the "brain" of my load balancer. It contains all the rules for HAProxy, telling it how to send requests to my two application servers and how to display the stats page.

4. compose.yml (my orchestration plan): This is the main file that brings everything together. It describes how my two application servers (web-01, web-02) and my load balancer (lb-01) work as a team, how they talk to each other on an internal network, and which ports are open.

Getting My App Image Ready (Docker Hub)
Before launching everything, I make sure my application's image is on Docker Hub:

Build the app image:

docker build -t tdorcas/budget_tracker:latest .

Log in to Docker Hub:

docker login

(Enter your Docker Hub credentials when prompted)

Push the image to Docker Hub:

docker push tdorcas/budget_tracker:latest

Launching the Whole Infrastructure (One Command!)
The coolest part is that I've made it so you can launch the entire infrastructure with just one command. Make sure you're in the main project folder:

docker compose up -d --build

This command does all the heavy lifting: it builds the image for my load balancer, pulls my application's image from Docker Hub for my web servers, and starts all the containers. You can check if they're running fine with:

docker compose ps

You should see web-01, web-02, and lb-01 online.

Testing and Proving the Load Balancer Works
I've made sure everything works as expected. Here's how you can test it too:

Check traffic distribution:
From your WSL terminal, run this command multiple times:

curl -I http://localhost:8082

You'll see the X-Served-By header change between web01 and web02. 
<img width="1166" height="361" alt="image" src="https://github.com/user-attachments/assets/c1921283-1fbe-4408-89e6-cf515e5f9e4a" />


View HAProxy statistics:
Open your browser and go to: http://localhost:8083/haproxy?stats
Log in with admin as the username and password as the password.
This page will show you that my servers (web01 and web02) are both "UP" (running) and receiving traffic. 
(Remember to include a screenshot of this page in your submission, showing the backend servers!)

What You'll Find in This Repository 
GitHub Repository Link: https://github.com/tdorcas-akim/budget_tracker.git

You'll find all the source files here: index.html, styles.css, script.js, nginx.conf, Dockerfile, lb/Dockerfile.lb, lb/haproxy.cfg, and compose.yml. I also have a .gitignore to keep out unnecessary or sensitive files.

Video Link: 



Credits

Exchange Rate APIs: Exchangerate-API and Currencyapi.com

Lab Infrastructure provided by: waka-man/web_infra_lab
