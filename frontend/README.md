# CleanVision — Frontend (Phase 1)

React + Vite + TypeScript + Tailwind frontend for CleanVision, a hospital cleanliness monitoring app.
This is Phase 1 of a 3-phase rebuild: design system, research-grounded UI, and the three core pages
(Landing, Login/Signup, Dashboard). See `p2.md` and `p3.md` for the prompts that continue the build in
an IDE agent (Cursor, Claude Code, etc.) with the backend attached.

## What's here

- **Design system** — `src/styles/tokens.css` (color tokens), `tailwind.config.ts` (type scale, tokens
  wired to Tailwind), Space Grotesk / Inter / IBM Plex Mono loaded in `index.html`.
- **Signature element** — `ScoreRing`, a circular gauge used in the hero, room cards, and auth panel.
  The accent violet is a deliberate nod to the blue-violet glow of hospital germicidal (UV-C) lamps —
  see the comment at the top of `tokens.css`.
- **Pages** — `LandingPage`, `AuthPage` (login/signup), `DashboardPage`, plus a `ComingSoonPage` stub for
  the three nav destinations (`/dashboard/scan`, `/dashboard/history`, `/dashboard/settings`) that Phase
  2 builds out fully — they're wired into navigation now, not dead links.
- **API client** — `src/lib/api.ts`, typed against the actual attached Flask backend's routes and
  response shapes (rooms, scan, history, reports/summary, health), with a "waking up the server" toast
  for Render's cold-start delay.
- **Auth** — `src/hooks/useAuth.ts` is a clearly-flagged local-only session, because the attached backend
  has no auth endpoints yet. Phase 2 replaces this once real endpoints exist.

## Running locally

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:5000` (see `vite.config.ts`), so run the Flask
backend locally alongside it. For a deployed backend instead, set `VITE_API_BASE_URL` — see
`.env.example`.

## Known gaps going into Phase 2

- Dark mode is not implemented yet — `darkMode: "class"` is wired into `tailwind.config.ts` and
  `tokens.css` has a comment marking where the `.dark` block goes.
- `/dashboard/scan`, `/dashboard/history`, `/dashboard/settings` are placeholder pages.
- Auth is local-only (see above).
