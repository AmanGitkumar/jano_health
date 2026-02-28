# 🏥 Dialysis Session Intake & Anomaly Dashboard

A full-stack application designed to register dialysis patients, record their treatment sessions, and automatically detect critical medical anomalies in real-time.

## 🚀 Features
* **Patient Management:** Register new patients with demographic and medical data.
* **Session Tracking:** Record detailed dialysis sessions including pre/post weights, vitals, and machine assignments.
* **Anomaly Detection Engine:** Automatically flags sessions on the dashboard if they meet critical thresholds:
  * High Blood Pressure (Systolic/Diastolic)
  * Abnormal Session Durations
  * Excessive Interdialytic Weight Gain
* **Live Dashboard:** A modern, responsive React interface that highlights anomalous patient sessions for immediate medical review.

## 💻 Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS (v4)
* **Backend:** Node.js, Express.js, TypeScript
* **Database:** MongoDB Atlas, Mongoose
* **Tools:** Postman (API Testing), Git

## 🛠️ How to Run Locally

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and start the server:
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
*Note: Ensure you have a `.env` file in the backend directory with your `MONGODB_URI` and `PORT=5000`.*

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite development server:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The frontend will be available at `http://localhost:5173`.

## 🤖 AI Tools Used (Collaboration & Workflow)
Throughout this project, AI (Gemini) was utilized as a pair-programming assistant to accelerate development and enforce best practices:
* **Security & Configuration:** AI initially suggested placing MongoDB credentials directly in the server file for rapid testing. I overrode this approach to enforce security best practices, moving credentials to a `.env` file and ensuring `.gitignore` was properly configured before committing.
* **Debugging & Problem Solving:** Used AI to rapidly identify and resolve an Express middleware routing bug (`Router.use() requires a middleware function`) and navigate the bleeding-edge migration to Tailwind CSS v4.
* **Logic Generation:** Collaborated with AI to scaffold the core mathematical thresholds for the Anomaly Detection Engine, ensuring the backend successfully caught edge cases (like missing vital data) without crashing.