<div align="center">
  <img src="frontend/public/logo.png" alt="CleanVision Logo" width="80" />
  <h1>CleanVision</h1>
  <p><strong>Multi-Tenant AI-Powered Cleanliness Monitoring Platform for Healthcare Facilities.</strong></p>

  <p>Move from guesswork to verified standards with real-time image analysis, multi-tenant role access, and automated alerts.</p>

  <p>
    <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" />
    <img alt="Python" src="https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat-square&logo=python&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black" />
    <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-FFCA28.svg?style=flat-square&logo=firebase&logoColor=black" />
  </p>
</div>

---

## ⚡ Features & Multi-Role Architecture

- **Multi-Tenant Organizations** — Platform **Admin** creates organizations, assigns **Supervisors**, each supervisor manages **Workers**, and **Patients** can request cleaning assistance.
- **Server-Side Custom Claims** — Role authority and organization scoping are enforced server-side via Firebase Custom Claims and Firestore Security Rules.
- **Baseline Architecture** — Register a room with a single reference photo stored securely in Firebase Storage.
- **Real-time AI Scoring** — Upload a photo and receive an immediate 0–100 cleanliness score with a clear status read powered by MobileNetV2.
- **Pure Firebase Stack** — Fully uses Firebase Auth + Firestore + Firebase Storage. No local disk persistent storage required on Render.

## 📊 Roles & Permissions

| Role | Scope | Key Capabilities |
|------|-------|------------------|
| **Admin** | Platform-Wide | Create organizations, assign Supervisors, view platform stats |
| **Supervisor** | One Organization | Manage Workers, manage Rooms, view team reports & cleaning requests |
| **Worker** | Assigned Org | Room dashboard, scan flow, history, settings |
| **Patient** | Assigned Room/Ward | View ward cleanliness status, submit cleaning requests |

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, TanStack Query
- **Backend**: Python, Flask, Firebase Admin SDK
- **Database & Storage**: Firebase Auth, Firestore, Firebase Storage
- **AI/ML**: TensorFlow / Keras (MobileNetV2 architecture)

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed_admin.py --email admin@cleanvision.com
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📄 Maintained By

Maintained by [Organization Name].
Licensed under the MIT License.