<div align="center">
  <img src="frontend/public/logo.png" alt="CleanVision Logo" width="80" />
  <h1>CleanVision</h1>
  <p><strong>AI-powered cleanliness monitoring for modern healthcare facilities.</strong></p>

  <p>Move from guesswork to verified standards with real-time image analysis, full audit trails, and automated alerts.</p>

  <p>
    <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" />
    <img alt="Python" src="https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat-square&logo=python&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black" />
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white" />
  </p>
</div>

---

## ⚡ Features

- **Baseline Architecture** — Register a room with a single reference photo. Every scan is measured against that precise baseline, not a generic standard.
- **Real-time AI Scoring** — Upload a photo and receive an immediate 0–100 cleanliness score with a clear status read.
- **Priority Dashboard** — Rooms are sorted by risk, automatically surfacing areas that need attention first.
- **Immutable Audit Trail** — Every scan is logged. Pull full histories for incident reviews or trend analysis.
- **Mock Mode** — Drop-in ready. Runs perfectly with a stable mock model before you deploy your own trained TensorFlow weights.

## 📊 Scoring System

| Score Range | Status | Color | Action |
|-------------|--------|-------|--------|
| **70–100** | `clean` | 🟢 Green | No action needed |
| **40–69** | `needs_attention` | 🟡 Amber | Monitor closely |
| **0–39** | `dirty` | 🔴 Red | ⚠️ **Alert**: Area requires cleaning |

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, Flask, Gunicorn
- **AI/ML**: TensorFlow / Keras (MobileNetV2 architecture)
- **Database**: SQLite (Zero config development)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*API runs at `http://localhost:5000`*

## 🤖 AI Model & Mock Mode

CleanVision ships with a sophisticated **Mock Mode** out of the box. 

If `backend/cleanliness_model.h5` is not present, the backend falls back to a deterministic hash-based scoring system. 
- **Stable outputs**: The same image always produces the same score.
- **Full feature parity**: Rooms, baselines, scans, and histories work seamlessly.
- **Zero code changes**: Simply drop your trained `.h5` model into the backend folder, and the system automatically switches to real AI inference.

### Training Your Own Model
Use `colab_training/train.ipynb` on Google Colab (with free GPU support) to train MobileNetV2 on your specific facility images. 

## 🏗 Architecture

```text
┌─────────────────────────────────────────────────┐
│                 CleanVision App                 │
│                                                 │
│  ┌─────────────────────────┐                            │
│  │  React Frontend         │                            │
│  └─────────────────────────┘                            │
│                         │  │  SQLite DB    │  │ │
│                         │  │  (rooms+scans)│  │ │
│                         │  └───────────────┘  │ │
│                         │                     │ │
│                         │  ┌───────────────┐  │ │
│                         │  │  AI Model     │  │ │
│                         │  │  MobileNetV2  │  │ │
│                         │  └───────────────┘  │ │
│                         └─────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🌐 Production Deployment

### Recommended Topology
- **Frontend**: Vercel or Netlify
- **Backend**: Render (Web Service)

### Backend Deployment (Render)
1. Point Render to the root repository, specifying `backend/` as the root directory.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app --timeout 90 --workers 2` (or use the included `Procfile`)
4. **⚠️ Critical Setup**: Add a **Persistent Disk** mounted at `/opt/render/project/src/uploads` to persist baseline photos and scan images across redeploys.

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms` | List all rooms |
| `GET` | `/api/rooms/:id` | Get a single room |
| `POST` | `/api/rooms/:id/baseline` | Upload baseline image |
| `POST` | `/api/scan` | Scan a room (predict cleanliness) |
| `GET` | `/api/rooms/:id/history` | Get scan history |
| `GET` | `/api/reports/summary` | Aggregate cleanliness stats |
| `GET` | `/api/health` | Health check |

## 📄 License

This project is licensed under the MIT License.