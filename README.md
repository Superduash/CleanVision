# CleanVision — Hospital Cleanliness Monitor

A full-stack web app for monitoring hospital room cleanliness using AI-powered image analysis.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 CleanVision App                 │
│                                                 │
│  ┌──────────────┐       ┌─────────────────────┐ │
│  │  React UI    │       │  Flask Backend      │ │
│  │  (Frontend)  │──────>│  (API + Static)     │ │
│  │              │  /api │                     │ │
│  └──────────────┘       │  ┌───────────────┐  │ │
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

## Features

- **Room Management** — Register hospital rooms with name, block, and a baseline "clean" photo
- **AI Scanning** — Upload a photo to get an AI-powered cleanliness score (0–100)
- **Status Tracking** — Green/Amber/Red status with alerts for dirty areas
- **Scan History** — Track cleanliness over time per room
- **Mock Mode** — Full functionality even without a trained model (hash-based stable scores)

## Scoring Table

| Score Range | Status | Color | Action |
|-------------|--------|-------|--------|
| 70–100 | `clean` | 🟢 Green | No action needed |
| 40–69 | `needs_attention` | 🟡 Amber | Monitor closely |
| 0–39 | `dirty` | 🔴 Red | ⚠️ **Alert**: Area requires cleaning |

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 16+
- npm

### Backend Setup

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the Flask backend
python backend/app.py
```

The API will start on `http://localhost:5000`.

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file for dev
cp .env.example .env

# Start the dev server
npm start
```

The React app will start on `http://localhost:3000` and proxy API requests to the Flask backend.

## Production Build & Deploy

### Single-Service Deploy (Recommended)

This app is designed as a single Python service — Flask serves both the API and the built React frontend.

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build
cd ..

# 2. Deploy the entire repo as a Python service
#    - On Render/Railway: use the Procfile
#    - On Heroku: `git push heroku main`
#    - The Procfile runs: gunicorn --chdir backend app:app
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port the server listens on |
| `FLASK_DEBUG` | `false` | Set to `true` for dev mode |
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of allowed CORS origins |
| `REACT_APP_API_BASE` | `/api` | API base URL (only needed in dev) |

## Mock Mode

The app ships without a trained AI model. When `backend/cleanliness_model.h5` is missing:

- The backend runs in **Mock Mode** with hash-based stable scores (same image → same score every time)
- All features work: rooms, baselines, scans, history, alerts
- The frontend shows a yellow "Mock prediction — model not yet trained" badge on scan results
- **No code changes needed** — just drop in the trained `.h5` file later and restart

### Training Your Model

Use `colab_training/train.ipynb` on Google Colab (free GPU) to train MobileNetV2 on your own clean/dirty room images. See the notebook for instructions.

## File Structure

```
CleanVision/
├── backend/
│   ├── app.py              # Flask API + static serving
│   ├── model.py            # AI model loader + mock fallback
│   ├── database.py         # SQLite database functions
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # Image uploads (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React Router setup
│   │   ├── pages/          # Page components
│   │   └── components/     # Reusable UI components
│   └── ...
├── colab_training/
│   └── train.ipynb         # Colab notebook for model training
├── data/                   # Training data (upload to Drive)
├── Procfile                # Deployment config
└── runtime.txt             # Python version for hosting
```

## Deployment

### Production Topology (Recommended)

- **Frontend → Vercel** (instant CDN, free tier, automatic preview deploys on every push)
- **Backend API → Render** (free tier, auto-deploys from `backend/` directory)

This is the canonical deploy path. The Flask backend can *also* serve the built React app via its catch-all route, but that's an alternative development convenience — do not use it as the primary production setup.

### Step-by-step

**1. Deploy backend on Render**

1. Create a new **Web Service** on Render pointing at this repo, root directory `backend/`.
2. Set **Build Command**: `pip install -r requirements.txt`
3. Set **Start Command**: `gunicorn app:app --timeout 90 --workers 2` (the `Procfile` sets this automatically)
4. **⚠️ Add a Persistent Disk**: Mount a disk at `/opt/render/project/src/uploads` (or wherever `UPLOAD_FOLDER` resolves). Without this, every redeploy wipes all uploaded room baseline images and scan history — rooms will still exist in the database but their images will 404. The database file should also live on the persistent disk; set `DATABASE_PATH` env var to a path on the disk.
5. Set environment variables:
   - `ALLOWED_ORIGINS` → your Vercel frontend URL (e.g. `https://cleanvision.vercel.app`) — **never leave this as `*` in production**
   - `FLASK_DEBUG` → `false`

**2. Deploy frontend on Vercel**

1. Import the repo on Vercel, set root directory to `frontend/`.
2. Set environment variable: `VITE_API_BASE_URL` → your Render backend URL (e.g. `https://cleanvision-api.onrender.com`)
3. Vercel will auto-build with `npm run build` and deploy.

### Cold-start note

Render free instances spin down after 15 minutes of inactivity. The first request after idle can take **30–60 seconds** while the container boots and TensorFlow loads the model. The UI shows a "Waking up the server…" notice after 5 seconds of a pending request so this doesn't look like a crash.

### Data persistence

SQLite + local `uploads/` are both ephemeral on Render without a persistent disk. **If you skip the disk setup, a redeploy = all rooms and scans disappear.** This will look exactly like the app is broken during a demo. Set up the persistent disk before the first demo.

## API Endpoints

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

## Tech Stack

- **AI Model**: ResNet-18 / MobileNetV2 (TensorFlow/Keras .h5)
- **Backend**: Python + Flask + flask-cors + Gunicorn
- **Database**: SQLite (zero setup for dev; add Render Persistent Disk for prod)
- **Frontend**: React 19 + TypeScript + Tailwind v4 + TanStack Query + motion.dev
- **PWA**: Workbox service worker via vite-plugin-pwa
- **Deployment**: Vercel (frontend) + Render (backend API)

## License

MIT