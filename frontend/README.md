# CleanVision — Hospital Cleanliness Monitoring System (Frontend)

React + Vite + TypeScript + Tailwind frontend for **CleanVision**, an AI-assisted hospital cleanliness monitoring and real-time alert platform.

## Key Features & Architecture

- **Single-Hospital Deployment Model**: Driven by a singleton `hospitalConfig` hook and API (`useHospitalConfig.ts`). No multi-tenant complexity or `orgId` required.
- **Dual Theme System ("Laboratory White" / "Monitor Glow")**: Full semantic token palette in `src/styles/tokens.css` with persistent theme switching and anti-flash synchronous initialization.
- **Role-Based Staff Access (Firebase Auth & Custom Claims)**:
  - `admin`: Full hospital setup, config management, and Manager account creation.
  - `manager`: Room QR generation, Inspector account creation, and hospital-wide alert management.
  - `inspector`: Room scanning flow, history, and block-filtered live alerts.
- **Public Patient Reporting (Unauthenticated Flow)**: `/report/:roomCode` allows visitors and patients to submit cleanliness issues with optional photos, backed by real-time Firestore listeners (`onSnapshot`).
- **AI Scanning Viewfinder**: Interactive camera scanning and cleanliness score evaluation interface (`/dashboard/scan`).
- **Real-Time Live Feed**: Firestore `onSnapshot` integration in `NotificationsPage.tsx` and `CleaningRequestsPage.tsx` for instant alert dispatch without manual reloads.

## Running Locally

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` requests to `http://localhost:5000` (see `vite.config.ts`). Run the Flask backend alongside it or set `VITE_API_BASE_URL` for remote deployments.

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the Flask backend (defaults to relative `/api`).
- `VITE_SHOW_DEMO_ACCOUNTS`: Set to `"true"` to enable tap-to-fill demo logins on `/staff/login` (defaults to `"false"`).
- `VITE_SHOW_QR_SIMULATOR`: Set to `"true"` to show the QR code simulator on public report pages (defaults to `"false"`).
