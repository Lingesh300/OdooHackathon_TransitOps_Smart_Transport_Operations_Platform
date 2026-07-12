TransitOps — Smart Transport Operations Platform

A full-stack Transport Management System built for the Odoo Hackathon.

TransitOps helps organizations manage fleet operations, trip dispatching, maintenance, fuel expenses, analytics, and role-based access through a centralized platform.

✨ Features
Frontend
Responsive dashboard built with HTML, CSS, and JavaScript
Role-Based Access Control (RBAC)
Fleet management
Trip Dispatch
Maintenance tracking
Fuel & Expense management
Analytics Dashboard
CSV Export
Vehicle Registry
Interactive UI with reusable components
Backend

Built using:

Node.js
Express.js
Supabase (PostgreSQL)
JWT Authentication
REST APIs
Backend Modules
Authentication
Vehicle Management
Driver Management
Trip Management
Maintenance Management
Fuel & Expense Management
Dashboard Analytics
Role-based Authorization
API Validation
Centralized Error Handling
🚀 Run Frontend

No installation required.

cd transitops-app
python3 -m http.server 8080

Open

http://localhost:8080
🔑 Login

This prototype uses mock authentication.

Any email
Any non-empty password
Choose a role from the dropdown

RBAC permissions update automatically.

🖥️ Frontend Project Structure
transitops-app/
├── index.html
├── css/
├── js/
│   ├── app.js
│   ├── components.js
│   ├── data.js
│   └── screens.js
⚙️ Backend Project Structure
fleet-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
├── server.js
├── package.json
└── .env.example
🛠 Backend Setup
cd fleet-backend

npm install

npm run dev

The backend connects to Supabase using the environment variables defined in .env.

📡 API

The backend exposes REST APIs for:

Authentication
Vehicles
Drivers
Trips
Maintenance
Fuel
Expenses
Dashboard
Analytics
🔄 Frontend ↔ Backend Integration

The frontend business logic is designed so it can be connected directly to the backend APIs.

Client-side actions can be replaced with REST API calls without changing the UI architecture.

⚠️ Current Limitations
Mock authentication on frontend
In-memory frontend state
No realtime updates
Analytics generated from available data
🏗 Tech Stack
Frontend
HTML5
CSS3
JavaScript
Backend
Node.js
Express.js
Supabase
