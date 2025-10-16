# 🧙‍♂️ Alchemist’s Grand Grimoire: AI Wellness Tracker

**Alchemist’s Grimoire** is a full-stack **AI-powered wellness application** engineered to ensure perfect medication adherence and provide intelligent, personalized health assistance.  
It combines a **magical user experience** with the **MERN stack** and **Google’s Gemini AI**, blending technology and design into one seamless system.

---

## 🎯 Core Functionality

### 🩺 Health Compliance & User Control
- **Dynamic Scheduling:** Web interface for creating detailed medication schedules (name, dosage, time, frequency).  
- **Adherence Metrics:** Interactive dashboard visualizes adherence rates, missed doses, and compliance trends.  
- **Variable Reminder Timing:** Flexible alert window — choose 5 min, 30 min, or 1 hr before a dose.  
- **Dynamic Snooze & Pause:** Instantly snooze a pending dose for a set duration directly from the dose card.  
- **Full Account Control:** Users can permanently delete all data (schedules, logs, subscriptions) upon account termination.  

### 🧠 AI & Notifications
- **Context-Aware AI Chatbot:** Powered by **Gemini AI**, it answers natural language health queries grounded in your live schedule and history.  
  > Example: *“Did I miss any dose yesterday?”*  
- **Dual-Channel Reminders:** Time-zone accurate reminders via **Email** and **Browser Push Notifications**.  
- **Google Calendar Sync:** Medication schedules auto-sync with your personal **Google Calendar** for seamless reminders.

---

## 🛠️ Technical Deep Dive

| **Category** | **Technology** | **Architectural Detail** |
|---------------|----------------|----------------------------|
| **Full Stack** | MERN (MongoDB, Express, React, Node.js) | Robust, scalable architecture with separate backend and frontend environments. |
| **Authentication** | JWT + Email OTP | Secure dual-token authentication with HttpOnly refresh tokens. |
| **Scheduling Logic** | Dynamic Cron + `moment-timezone` | External Cron Trigger calculates reminder times dynamically based on `reminderOffsetMinutes` and user’s timezone. |
| **Push Notifications** | Web Push (VAPID) | Encrypted browser notifications using VAPID keys sent directly from the backend. |
| **State Management** | Zustand | Centralized and fast frontend state sync for user data, dashboard metrics, and preferences. |
| **Deployment** | Render (Backend) + Vercel/Netlify (Frontend) | Decoupled deployment for maximum scalability and CI/CD flexibility. |

---

## 🧩 Project Structure

```
WEBSTER2025/
├── backend/
│ ├── src/
│ │ ├── controllers/ # Authentication, Chatbot, Dose Log, Medication logic
│ │ ├── db/ # MongoDB connection, Nodemailer transporter
│ │ ├── middleware/ # JWT verification
│ │ ├── models/ # Schemas: User, DoseLog, MedicationSchedule
│ │ ├── routes/ # Express API endpoints
│ │ ├── services/ # Core logic (notifications, email, AI responses)
│ │ └── utils/ # Error handling, async wrapper, JWT helpers
│ ├── .env # CRITICAL: Environment secrets & keys
│ └── package.json
│
└── frontend/
├── src/
│ ├── components/ # UI components (Sidebar, DoseCard, AdherenceChart)
│ ├── hooks/ # Zustand stores (useAuthStore, useDoseStore)
│ ├── pages/ # Views (Dashboard, SettingsPage)
│ ├── services/ # API integrations & push notification utilities
│ └── styles/ # Tailwind and global styles
├── public/ # Static assets (sw.js - Service Worker)
├── vercel.json # SPA routing fix for Vercel deployment
└── package.json
```

---

## ⚙️ Running Locally

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/alchemist-grimoire.git
cd alchemist-grimoire

### 1️⃣ Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```
2️⃣ Start the Development Servers
```
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend App
cd frontend
npm run dev
```

### 3️⃣ Access the Application

Start the servers and open your browser at 👉 **http://localhost:5173**

---

## 🧠 Key Highlights

💬 **Gemini AI Chatbot** — Conversational health assistant with personalized insights.  
🔔 **Real-Time Reminders** — Browser + email notifications for every medication event.  
📊 **Adherence Dashboard** — Visual tracking of your medication history and consistency.  
☁️ **Google Calendar Integration** — Seamlessly sync all doses with your schedule.  
🧱 **Modular MERN Architecture** — Fully separated backend and frontend codebases.  
🧵 **Zustand State Management** — Lightweight, reactive, and blazing fast global store.  

---

## 🚀 Deployment

| Service | Purpose | URL / Config |
|----------|----------|--------------|
| **Render** | Backend API / Scheduler Worker | Deploys Express API & Cron Jobs |
| **Vercel / Netlify** | Frontend React SPA | Deployed via CI/CD pipeline |
| **MongoDB Atlas** | Cloud Database | Stores all user, medication, and adherence logs |
| **Gemini AI API** | AI Chatbot Backend | Powers intelligent conversations |

---

## 🧾 Environment Variables

Make sure to create `.env` files in both backend and frontend directories.

### **Backend .env**
```env
PORT=5000
MONGO_URI=<your_mongo_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_email_address>
EMAIL_PASS=<your_email_password>
VAPID_PUBLIC_KEY=<your_public_vapid_key>
VAPID_PRIVATE_KEY=<your_private_vapid_key>
GEMINI_API_KEY=<your_google_gemini_api_key>


☁️ Google Calendar Integration — Sync all doses to your schedule.

🧱 Modular MERN Architecture — Fully separated backend and frontend codebases.

🧵 Zustand State Management — Lightweight, reactive, and blazing fast.
