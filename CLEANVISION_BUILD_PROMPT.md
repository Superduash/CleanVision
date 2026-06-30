# CleanVision — Full-Stack Build Prompt for Qwen Coder

Paste this entire file into your IDE agent (Qwen Coder) as one prompt. It must execute everything below in a single pass: full file structure, full working code for every file, no placeholders, no `// TODO`, no `pass # implement later`. Every file must be complete and immediately runnable.

---

## 0. Role & Context

You are building **CleanVision**, a hospital cleanliness monitoring web app.

- A user uploads a "baseline" clean photo of a hospital room/area.
- Later, they upload a new photo of the same area to "scan" it.
- An AI model (MobileNetV2, trained separately on Google Colab) scores the new photo 0–100 for cleanliness and assigns a status: `clean` (≥70), `needs_attention` (40–69), `dirty` (<40, fires an alert).
- This is hosted online (not run locally + ngrok), so all configuration must be environment-variable driven and deploy-ready for a standard host (e.g. Render/Railway for the Flask API, Vercel/Netlify for the React frontend, or both served from Flask as a single deployment — implement the single-Flask-serves-React-build option as the default since it's simplest to host as one service).
- The trained model file `cleanliness_model.h5` does **not exist yet** — labeling and training happen in parallel with this build. The backend MUST run perfectly without that file present, by falling back to a clearly-labeled mock predictor (see Section 5). This is not optional — the app must boot and be fully testable today.

Quality over feature count. Build the complete basic system correctly rather than a half-built system with extra features.

---

## 1. Tech Stack

```
AI Model:    MobileNetV2 (TensorFlow/Keras .h5), loaded by Flask if present, mock mode if absent
Backend:     Python + Flask + flask-cors
Database:    SQLite (zero setup, single file)
Frontend:    React + Tailwind CSS, built and served as static files BY Flask in production
Frontend dev: React dev server (npm start) talking to Flask via VITE/CRA proxy or env var API base
Hosting:     Single deployable service (Flask serves API + built React) — works on Render, Railway, Fly.io, etc.
Repo:        https://github.com/Superduash/CleanVision
```

---

## 2. Full File Structure

Create exactly this structure:

```
CleanVision/
├── .gitignore
├── README.md
├── Procfile
├── runtime.txt
│
├── backend/
│   ├── app.py
│   ├── model.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── cleanliness_model.h5        ← NOT created by you; .gitignore'd; app must run without it
│   └── uploads/
│       ├── baselines/
│       │   └── .gitkeep
│       └── scans/
│           └── .gitkeep
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.jsx
│       ├── config.js
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── RoomSetup.jsx
│       │   ├── ScanPage.jsx
│       │   └── HistoryPage.jsx
│       └── components/
│           ├── RoomCard.jsx
│           ├── ScoreGauge.jsx
│           ├── Header.jsx
│           └── LoadingSpinner.jsx
│
├── colab_training/
│   └── train.ipynb                 ← stub notebook with the training cells, see Section 6
│
└── data/
    ├── README.md
    ├── clean/
    │   └── .gitkeep
    └── dirty/
        └── .gitkeep
```

---

## 3. Backend — Exact Specifications

### `backend/database.py`
SQLite database at `backend/database.db` (created on first run, gitignored).

Tables:
- `rooms(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, block TEXT, baseline_image_path TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
- `scans(id INTEGER PRIMARY KEY AUTOINCREMENT, room_id INTEGER NOT NULL, image_path TEXT, cleanliness_score REAL, status TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(room_id) REFERENCES rooms(id))`

Functions (all using parameterized queries, proper connection handling with context managers, returning plain dicts/lists — not row objects):
- `init_db()` — creates tables if not exist, enables `PRAGMA foreign_keys = ON`
- `add_room(name, block) -> int` — inserts, returns new room id
- `set_baseline(room_id, image_path) -> None`
- `get_all_rooms() -> list[dict]` — each room dict includes `latest_score`, `latest_status`, `last_scanned` pulled via a LEFT JOIN/subquery against `scans` (most recent scan per room); rooms with no scans yet should show `null` for these fields, not crash
- `get_room(room_id) -> dict | None`
- `add_scan(room_id, image_path, score, status) -> int` — returns new scan id
- `get_scan_history(room_id, limit=10) -> list[dict]` — most recent first

### `backend/model.py`
- On import, attempt to load `cleanliness_model.h5` from the same directory using TensorFlow/Keras.
- If the file is missing OR loading fails for any reason, catch the exception, print a clear warning (`"[CleanVision] No trained model found — running in MOCK MODE. Predictions are randomized for testing only."`), and set an internal `MOCK_MODE = True` flag.
- `predict(image_path) -> dict` with keys `score` (float, 0–100, one decimal), `status` (`'clean' | 'needs_attention' | 'dirty'`), `mock` (bool):
  - **Real mode:** open image with PIL, convert to RGB, resize to 224×224, normalize `/255.0`, expand dims, run `model.predict()`, take the scalar output. Treat output as P(dirty) with class mapping `{'clean': 0, 'dirty': 1}` (document this assumption clearly in a comment, and note it must be verified/flipped against the actual `class_indices` printed during Colab training). `score = round((1 - prediction) * 100, 1)`.
  - **Mock mode:** generate a pseudo-random but stable score by hashing the image file's bytes (e.g. `int(hashlib.md5(bytes).hexdigest(), 16) % 100`), so the same image always returns the same score during testing (not pure `random.random()`, which would make manual testing useless).
  - Status thresholds (shared logic, used by both modes): `score >= 70 → 'clean'`, `40 <= score < 70 → 'needs_attention'`, `score < 40 → 'dirty'`.
- Export `MOCK_MODE` so `app.py` can surface it in API responses if useful.

### `backend/app.py`
Flask app, CORS enabled for all origins in dev (tighten via env var `ALLOWED_ORIGINS` in prod, comma-separated, default `*`).

On startup: call `database.init_db()`, ensure `uploads/baselines/` and `uploads/scans/` exist (`os.makedirs(..., exist_ok=True)`).

Use `werkzeug.utils.secure_filename` on all uploaded filenames. Validate uploaded files are images by extension (`.jpg, .jpeg, .png, .webp`) and reject others with `400`.

Routes:

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/rooms` | form fields `name`, `block` → `database.add_room` → `{success, room_id}` |
| GET | `/api/rooms` | → `{rooms: [...]}` |
| GET | `/api/rooms/<int:room_id>` | → `{room: {...}}` or `404 {error}` if not found |
| POST | `/api/rooms/<int:room_id>/baseline` | file `image` → save as `uploads/baselines/<room_id>_baseline.<ext>` → `database.set_baseline` → `{success, image_path}` |
| POST | `/api/scan` | form field `room_id`, file `image` → validate room exists (404 if not) → save as `uploads/scans/<room_id>_<unix_timestamp>.<ext>` → `model.predict(path)` → `database.add_scan` → `{score, status, room_id, mock}` |
| GET | `/api/rooms/<int:room_id>/history` | → `{history: [...]}` |
| GET | `/api/health` | → `{status: "ok", mock_mode: bool}` — used by frontend/deploy checks |

Every route wrapped in try/except returning `{"error": "..."}` with appropriate status code (400/404/500) on failure — never let an unhandled exception 500 with a stack trace to the client.

At the bottom, add static-serving so Flask serves the built React app in production:
```python
from flask import send_from_directory
import os

FRONTEND_BUILD = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join(FRONTEND_BUILD, path)):
        return send_from_directory(FRONTEND_BUILD, path)
    index_path = os.path.join(FRONTEND_BUILD, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_BUILD, 'index.html')
    return jsonify({"status": "CleanVision API running", "note": "frontend build not found"}), 200
```
This route must be defined AFTER all `/api/*` routes. Run with `host='0.0.0.0', port=int(os.environ.get('PORT', 5000))`, `debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'`.

### `backend/requirements.txt`
Pin reasonable versions: `flask`, `flask-cors`, `tensorflow`, `pillow`, `python-dotenv`, `gunicorn`.

### `backend/.env.example`
```
PORT=5000
FLASK_DEBUG=false
ALLOWED_ORIGINS=*
```

### Root `Procfile`
```
web: gunicorn --chdir backend app:app
```

### Root `runtime.txt`
```
python-3.11.9
```

---

## 4. Frontend — Exact Specifications

### `frontend/src/config.js`
```javascript
const API_BASE = process.env.REACT_APP_API_BASE || '/api';
export default API_BASE;
```
This is the key decision for "online hosting": when Flask serves the built React app, relative `/api` just works with no env var needed in production. For local dev against a separately-running Flask, set `REACT_APP_API_BASE=http://localhost:5000/api` in `frontend/.env`.

### `frontend/.env.example`
```
REACT_APP_API_BASE=http://localhost:5000/api
```

### `frontend/src/App.jsx`
React Router setup (use `react-router-dom`, add it to `package.json` dependencies) with routes:
- `/` → `Dashboard`
- `/setup` → `RoomSetup`
- `/scan/:roomId` → `ScanPage`
- `/history/:roomId` → `HistoryPage`

Wrap all routes with `<Header />` rendered once above the `<Routes>`.

### `frontend/src/components/Header.jsx`
Simple sticky top bar: "CleanVision" title + small subtitle "Hospital Cleanliness Monitor", Tailwind styled, links Dashboard logo back to `/`.

### `frontend/src/components/LoadingSpinner.jsx`
Small reusable Tailwind spinner component, accepts optional `label` prop.

### `frontend/src/pages/Dashboard.jsx`
- On mount, `axios.get(\`${API_BASE}/rooms\`)`, store in state, re-fetch every 30s via `setInterval` (cleaned up on unmount).
- While first loading: show `<LoadingSpinner label="Loading rooms..." />`.
- If zero rooms: show an empty state with a prompt to add the first room.
- Otherwise render a responsive grid of `<RoomCard />`, one per room.
- "+ Add Room" button at top right, links to `/setup`.

### `frontend/src/components/RoomCard.jsx`
Props: `room` object (`id, name, block, latest_score, latest_status, last_scanned`).
- Room name + block.
- Status badge: green/`clean`, amber/`needs_attention`, red/`dirty`, gray if `latest_status` is null ("Not yet scanned").
- Score text e.g. `"72 / 100"`, or `"—"` if null.
- Last scanned timestamp, human-relative if easy, otherwise raw, or "Never" if null.
- Two buttons: "Scan Now" → `/scan/:id`, "History" → `/history/:id`.

### `frontend/src/pages/RoomSetup.jsx`
- Form: text input (room name, required), select dropdown (block: Block A/B/C/D, required), file input (baseline image, required, `accept="image/*" capture="environment"`).
- Client-side validation before submit; disable submit button while incomplete.
- On submit: `POST /api/rooms` (name, block as form data) → get `room_id` → `POST /api/rooms/:id/baseline` (multipart with the image) → on success show a brief success message, then `navigate('/')`.
- Handle and display errors from either request without crashing.

### `frontend/src/pages/ScanPage.jsx`
- Read `roomId` from `useParams()`.
- On mount, `GET /api/rooms/:roomId` to fetch room name + baseline image path; show baseline image (left/top on mobile) using the image's full URL built from the API base origin.
- File input (`accept="image/*" capture="environment"`) + large prominent "Scan Now" button.
- On scan: `POST /api/scan` multipart (`room_id`, `image`) → show `<LoadingSpinner />` while waiting → on success render `<ScoreGauge score={...} status={...} />` plus the uploaded photo preview, plus a clear red banner "⚠️ ALERT: Area requires cleaning" when `status === 'dirty'`.
- If `mock: true` comes back in the response, show a small visible badge "Mock prediction — model not yet trained" so it's obvious during testing.

### `frontend/src/components/ScoreGauge.jsx`
Props: `score` (number 0–100), `status` (string).
- Large circular/rounded number display of the score.
- Background/ring color by status: green/amber/red as above.
- Status label text underneath.
- Sized to be clearly readable on a phone screen.

### `frontend/src/pages/HistoryPage.jsx`
- Read `roomId` from params, `GET /api/rooms/:roomId/history`.
- Render a simple reverse-chronological list/table: thumbnail, score, status badge, timestamp.
- Loading and empty states handled.

### `frontend/tailwind.config.js`, `postcss.config.js`, `frontend/src/index.css`
Standard Tailwind v3 setup (`@tailwind base; @tailwind components; @tailwind utilities;` in `index.css`), `content` glob covering `./src/**/*.{js,jsx}`.

### `frontend/package.json`
Standard CRA-based package.json including `react`, `react-dom`, `react-router-dom`, `axios`, `tailwindcss`, `autoprefixer`, `postcss`, plus the standard CRA scripts (`start`, `build`, `test`).

---

## 5. Mock Mode — Non-Negotiable Requirement

The dataset isn't labeled and the model isn't trained yet. The agent must NOT block app functionality on this. Confirm explicitly in your output that:
1. The Flask app boots successfully with `cleanliness_model.h5` absent.
2. `/api/scan` returns a real, stable (hash-based, not random-per-call) score in mock mode.
3. The frontend visibly flags mock predictions to the user (small badge, not blocking).

This lets the full app — rooms, baselines, scans, history, alerts, UI — be tested end-to-end today, with the real model dropped in later with zero code changes (just replace the `.h5` file).

---

## 6. `colab_training/train.ipynb`

Create a real, valid `.ipynb` (not a placeholder text file) containing markdown + code cells for: mounting Drive, installing `albumentations`/`tensorflow`, augmenting the `dirty/` images (flip, brightness/contrast, rotate ±15°, Gaussian noise, random shadow, light blur — 2 augmented copies per original), copying `clean/` + augmented `dirty/` into a combined `dataset/` folder, building MobileNetV2 (frozen base, GlobalAveragePooling2D → Dropout 0.3 → Dense 128 relu → Dropout 0.2 → Dense 1 sigmoid), training with `ImageDataGenerator` (80/20 split) for 25 epochs with early stopping (patience 5), printing `class_indices`, and saving to `cleanliness_model.h5`. Include a final markdown cell reminding the user to verify which class index is `clean` vs `dirty` and adjust `backend/model.py` if needed.

---

## 7. `data/README.md`
Short file explaining: put labeled photos in `data/clean/` and `data/dirty/`; worn-but-trash-free floors are `clean`; keep duplicates; this folder is what gets zipped and uploaded to Drive for the Colab notebook in Section 6.

---

## 8. Root `README.md`
Write a real, complete README: project description, architecture diagram (text-based is fine), local dev instructions (backend: `pip install -r backend/requirements.txt`, `python backend/app.py`; frontend: `cd frontend && npm install && npm start`), production build/deploy instructions (`npm run build` inside `frontend/`, then deploy the repo as a single Python service with the `Procfile`), note on mock mode, and the scoring table (70–100 clean/green, 40–69 needs_attention/amber, 0–39 dirty/red, alert fires below 40).

## `.gitignore`
Cover: `node_modules/`, `frontend/build/`, `__pycache__/`, `*.pyc`, `backend/database.db`, `backend/uploads/baselines/*` and `backend/uploads/scans/*` (but keep `.gitkeep`), `backend/cleanliness_model.h5`, `.env`, `*.env`, `.DS_Store`.

---

## 9. Git & GitHub — Required Final Step

After all files above are created and you've verified the backend boots (`python backend/app.py`) and the frontend builds (`npm run build` inside `frontend/`) without errors, run:

```bash
git init
git add .
git commit -m "Initial CleanVision scaffold: Flask backend, React frontend, SQLite, mock-mode model"
git branch -M main
git remote add origin https://github.com/Superduash/CleanVision.git
git push -u origin main
```

If the remote already has commits/conflicts, do not force-push — report the conflict instead of overwriting history.

---

## 10. Definition of Done

Do not stop until all of the following are true:
- Every file listed in Section 2 exists with complete, working code — zero TODOs, zero stub functions.
- `python backend/app.py` starts cleanly with no `.h5` file present and logs the mock-mode warning.
- All 6 API routes work and were sanity-tested (e.g. via `curl`) for at least the happy path.
- `npm install && npm start` inside `frontend/` runs the app with no console errors, and `npm run build` succeeds.
- The repo has been committed and pushed to `https://github.com/Superduash/CleanVision` on `main`.

Build all of it now, in order, without pausing for confirmation between files.
