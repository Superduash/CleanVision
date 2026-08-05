# prompt2.md — CleanVision: Single-Hospital Model, Public QR Reporting, Staff Dashboards (Antigravity build)

> Run this after `prompt1.md`'s security fix (§2 there — server-side role assignment via custom claims) is in place. **This document corrects one thing from `prompt1.md`: drop the multi-organization model entirely.** The reference screenshots make it clear this is a single-hospital deployment, not a multi-tenant platform. If any `organizations` collection, "Create Organization" UI, or org-picker exists from the prior pass, remove it — see §1.
>
> Visual direction: reuse the friend's screenshots for **information architecture and flow only** — screen structure, the issue-type chip list, the QR-scan pattern, the demo-account picker. Do **not** adopt their blue color palette or flat card style wholesale — this app already has its own locked design system (elevated-neutral canvas, teal/violet color grammar, one-hero-per-screen hierarchy discipline from the earlier UI passes). Translate their structure into our existing tokens, don't reset the palette.

---

## 1. Correction: single hospital, not multi-tenant

Delete, if present from a prior pass: the `organizations` Firestore collection, any "Create Organization" screen, any org-picker/switcher in the UI, `orgId` as a *created-by-admin* concept.

**Replace with:** a single Firestore singleton document, `hospitalConfig/main`, holding everything that makes this deployment specific to one hospital:
```
hospitalConfig/main
  hospitalName: string          // e.g. "City General Hospital"
  hospitalCode: string           // e.g. "CGH" — used as the prefix in QR room codes
  blocks: string[]               // e.g. ["A", "B", "C", "D"] — editable list, not hardcoded
  supportEmail: string
  logoUrl: string | null
  updatedAt: timestamp
  updatedBy: uid
```
This is what "easily changeable by management" actually means in practice — not editing source code, but an **Admin-only Settings screen** (§7) that reads/writes this one document. Non-technical hospital staff should never need to touch a `.env` file or a code file to rename a block or update the support email.

Every other collection (`users`, `rooms`, `scans`, `issueReports`) drops its `orgId` field entirely — there's exactly one hospital, so that field was only ever needed to distinguish tenants, and there's nothing to distinguish. `rooms.block` still exists (it's a real physical grouping, from `hospitalConfig.blocks`), it just isn't a tenant boundary anymore.

Firestore Security Rules and every backend query from `prompt1.md` that filtered by `orgId` — remove that filter, it's dead weight now. Everything else in `prompt1.md` (custom claims for role, server-side account provisioning, Firestore rules structure) stays correct and unaffected by this correction.

### 1a. Future-proofing conventions — build single-hospital, stay one migration away from multi-hospital

This deployment is genuinely for one hospital right now — don't build an org picker, org switcher, or any multi-hospital UI. But follow these conventions so that *if* this ever needs to serve multiple hospitals later, it's an additive schema change, not a rewrite:

- **Never hardcode `hospitalConfig/main`'s path or the hospital code inline.** Route every read of the hospital config through one helper — a single `useHospitalConfig()` hook on the frontend, one `get_hospital_config()` function on the backend. Every other file imports and calls that helper; none of them know or care that it happens to be a singleton today. If this ever becomes `hospitals/{hospitalId}`, only that one helper changes.
- **Never hardcode the hospital code string (e.g. `"CGH"`) anywhere in logic** — QR generation, room-code parsing, display text — always read it from `hospitalConfig.hospitalCode` via the helper above. The room-code format (`{hospitalCode}-{block}-{floor}{room}-{sequence}`) is already globally namespaced by design specifically so codes never collide if a second hospital is added later.
- **Define a single constant for "the current hospital's identity"** (e.g. `CURRENT_HOSPITAL_ID = "default"`) in one config file, referenced anywhere code needs to know which hospital it's operating on. Today it's a hardcoded constant; later it becomes a value resolved from the QR code/subdomain/session instead — but every call site already expects to ask for it rather than assume it, so the call sites don't change.
- Do not skip any of these to save time — they add zero visible complexity to today's single-hospital build (still one config doc, still no picker, still no multi-tenant rules), they just prevent the "hospital" concept from getting silently baked into fifty different places where it'd have to be hunted down individually later.

---

## 2. Roles — exactly three staff roles, zero patient accounts

`admin`, `manager` (the "Supervisor" from `prompt1.md` — rename consistently to `manager` everywhere, matching the reference UI's labeling), `inspector` (the "Worker" from `prompt1.md` — rename to `inspector`). **There is no `patient` role, no patient account, no patient login, ever.** The public reporting flow in §4 is completely unauthenticated — delete any patient Firebase Auth signup path if one exists from a prior pass.

**Accounts are provisioned, never self-registered:**
- The very first Admin comes from `prompt1.md`'s `seed_admin.py` (env-driven, run once).
- Admin creates Manager accounts (server-side, custom claims, per `prompt1.md` §2's pattern).
- Manager creates Inspector accounts, and assigns each Inspector to one or more Blocks (`assignedBlocks: string[]` on their `users/{uid}` doc / custom claim) — this assignment is what makes "alerts dispatched to staff assigned to Block B" (§4) actually resolvable.
- `admin` implicitly has access to all blocks ("Access: Block ALL" per the reference dashboard) — don't require an explicit assignment list for admin.

**Demo accounts (for the internship presentation only):** build the tap-to-fill demo login picker from the reference screenshot, but gate its visibility behind an env flag: `VITE_SHOW_DEMO_ACCOUNTS` (default `false`). Seed three real demo accounts (`admin@hospital.com`, plus a manager and inspector demo login) via a `seed_demo.py` script using the same server-side provisioning path as real accounts — not a special-cased shortcut. **Before real handoff to the hospital, this flag must be set to `false` in production env vars** — flag this explicitly in the deployment checklist (§9), since shipping tap-to-fill admin credentials to a real hospital deployment is a real security mistake, not just a cosmetic demo leftover.

---

## 3. Root routing — patient report is the default, staff is one click away

- `/` → boots into a brief loading state (§8), then:
  - No valid staff session → render the Patient Report screen directly (§4) as if it were the root — this is the default experience for anyone opening the link, matching "patient immediately goes to screen from landing page."
  - Valid staff session found → redirect straight to that role's dashboard (`/admin`, `/manager`, `/inspector`).
- A small **"Staff Login"** button, top-right, is present on the Patient Report screen at all times (per the reference screenshot) → `/staff/login`, which shows the login form + the env-gated demo-account picker from §2.
- `/staff/login` while already authenticated as staff → redirect to that role's dashboard, don't show the login form again (avoid the same redirect-loop class of bug flagged in `prompt1.md` §6 — test this path specifically).

---

## 4. Patient reporting flow — fully public, no account, ever

Build to match the reference screenshot's structure exactly, restyled to this app's existing tokens:

- **QR autofill banner:** when the page loads via a QR-encoded URL (`/report/:roomCode`, e.g. `/report/CGH-B-2204-B1`), show a confirmation banner: block, floor, room number, hospital name, sourced from a **public-readable** lookup (see the Firestore split below) — with a "Change QR" action for the rare case someone needs to correct it.
- **Issue type chips** (single-select, exact list from the reference — use these labels, don't invent different ones): *Wet Floor & Water Spill, Trash Bin Overflowing, Soap Dispenser Empty, Paper Towel Empty, Dirty Toilet / Unsanitized, Odour Issue / Ventilation.*
- **Photo capture** — reuse the existing camera component/pattern from the Scan flow (`capture="environment"` on mobile), optional but encouraged, not required to submit.
- **Optional comment** field.
- **Submit → "Send Alert to On-Duty Worker"** — on success, show a clear confirmation state (not just a toast that could be missed) — the person reporting a spill on a wet floor needs to know it actually went through before they walk away.
- Footer microcopy stating alerts go to staff assigned to that block, matching the reference.

**Firestore/Storage design for this — this is the one place public write access exists, so be deliberate:**
- Split room data into two pieces: `rooms/{roomId}` (private — score, scan history, staff-only per `prompt1.md` §9's rules) and a `roomLookup/{roomCode}` doc (public-readable only: `roomId`, `block`, `floor`, `roomNumber`, `hospitalName` — nothing else) that the QR code's URL resolves against. This means a QR code (or a guessed URL) can only ever reveal a room's location label, never its cleanliness score or history.
- `issueReports/{reportId}`: Firestore rule allows **create** with no auth required, provided the payload references a `roomCode` that exists in `roomLookup` — reject writes to nonexistent room codes at the rules level. Allow **no public read, no public update, no public delete** — only staff (role `inspector`/`manager` assigned to that block, or `admin`) can read or resolve these.
- Storage: a public-write-only path (`issueReports/{reportId}/photo.jpg`) for the optional photo, not publicly readable — only staff-authenticated reads.
- **Abuse mitigation, minimum viable for now:** add a simple client-side soft-limit (e.g., `localStorage` timestamp — block a second submission from the same device within 60 seconds) so an accidental double-tap doesn't spam two reports. Note in the deployment checklist that **Firebase App Check** is the correct real mitigation against scripted abuse of this public-write endpoint, and should be added before wide public rollout even though it's not required for the presentation build.

## 5. QR generation & the "Simulate QR Scan" dev tool

- **Manager** (and Admin) can generate and print a QR code per room from the Room management screen — encode `${APP_URL}/report/{roomCode}`, `roomCode` format `{hospitalCode}-{block}-{floor}{room}-{sequence}` matching the reference's `CGH-B-2204-B1` pattern, pulled from `hospitalConfig.hospitalCode` (§1) rather than hardcoded. Reuse the `RoomQRCode` + Print QR pattern already specified in `UIPrompt.md` §4 — this is the same feature, just now generating a room code in this format instead of a bare numeric room ID.
- **"Simulate Door QR Scan"** picker (reference screenshot 3): a dev/demo convenience that lists a few real rooms and lets you jump straight to their `/report/:roomCode` without a physical printed code or camera. Genuinely useful for the internship presentation. Gate it the same way as the demo accounts: `VITE_SHOW_QR_SIMULATOR` (default `false`), reachable from a small icon near "Staff Login" on the Patient Report screen when the flag is on — **must be off for the real hospital handoff**, same reasoning as §2's demo accounts.

## 6. Staff dashboards — Admin, Manager, Inspector

Keep this app's own established hierarchy discipline (one clear hero per screen, quiet supporting stats) rather than copying the reference's flat equal-weight card grid verbatim. The greeting banner *is* allowed to be the hero here since it already carries the two numbers that matter most (today's audit count, average score) — extend it with the live Visitor Alerts count so it's the single place someone glances first thing in a shift.

- **Admin (`/admin`):** everything Manager has, plus: create/manage Manager accounts, edit `hospitalConfig` (§7), platform-wide (all-block) visibility with no assignment restriction.
- **Manager (`/manager`):** create/manage Inspector accounts and their block assignments, Room + QR management (§5), Reports & Trends scoped to their hospital, a **live** Visitor Alerts feed (open issue reports across all blocks they oversee) with the ability to reassign or escalate.
- **Inspector (`/inspector`):** Scan Bathroom (existing camera/AI flow, unchanged functionally), Inspection Logs (their own scan history), a **live** Visitor Alerts feed filtered to their assigned block(s) only, with a "Mark Resolved" action once they've handled it.
- All three: mobile-first, per `prompt1.md` §4 and the earlier mobile checklist (`UIPrompt.md` §0) — Admin should still be usable on a phone even if it's used desktop-primary in practice.

## 7. Admin Settings — hospital config, not code edits

Build the `hospitalConfig/main` editor (§1) as an Admin-only screen: hospital name, hospital code (used in QR room codes — changing this doesn't need to retroactively rewrite existing codes, just affects newly generated ones), the editable blocks list (add/rename/remove a block), support email, logo upload. Writes go through the same server-verified, role-checked pattern as everything else in `prompt1.md` §2 — this is a privileged write, not a public one.

## 8. Loading states — replace generic spinners with the calm boot treatment

Build one reusable `BootSplash`/`PulseLoader` component matching the reference screenshot: centered shield/checkmark mark inside a soft radial glow (concentric faint rings), app name, one-line subtitle, small version/footer text — with a **slow breathing pulse** (opacity or scale oscillating gently, ~1.6–2s cycle, `ease-in-out`, not a spinning circle). Use this specific component for:
- Initial app boot (resolving auth/session before routing per §3).
- Any full-screen loading state that isn't a shaped skeleton (skeletons stay as already specified in `UIPrompt.md` §3.6 for content-shaped loading — this pulse treatment is specifically for the "we don't know what we're about to show yet" boot moment, not for every loading state in the app).
Respect `prefers-reduced-motion` — fall back to a static (non-pulsing) version per the existing motion rules.

## 9. Deployment checklist additions (on top of `prompt1.md` §11)

- [ ] `VITE_SHOW_DEMO_ACCOUNTS=false` and `VITE_SHOW_QR_SIMULATOR=false` set in the **real hospital production** environment — both should only be `true` on whatever deployment is used for the internship presentation itself, never on the version handed off for actual use.
- [ ] `hospitalConfig/main` seeded with the real hospital's name/blocks/code before handoff — don't ship with demo/placeholder values as the live config.
- [ ] Firebase App Check evaluated (added if time allows, documented as a known follow-up if not) for the public `issueReports` write path per §4.
- [ ] Full role chain re-tested end-to-end after this pass specifically: QR scan (or simulator) → submit a report with no login at any point → confirm it appears live on the correctly-assigned Inspector's dashboard → Inspector resolves it → confirm status updates without a manual refresh.
- [ ] Confirm the root `/` route genuinely never requires login for a patient — test in a fully logged-out, cache-cleared browser session.

## 10. Done-when checklist

- [ ] No `organizations` collection, no org-creation UI, no `orgId` field anywhere in the schema or code — fully replaced by the `hospitalConfig/main` singleton (§1).
- [ ] Zero patient accounts exist anywhere in the system — the reporting flow is verified to work with no authentication at any step.
- [ ] Only three staff roles exist (`admin`, `manager`, `inspector`), each provisioned server-side only, never self-registered.
- [ ] Demo accounts and the QR simulator are both env-flag-gated and confirmed off in the production env config.
- [ ] `BootSplash` pulse-loading component replaces every generic/default spinner in the app.
- [ ] A Manager can generate and print a room's QR code, and scanning it (or using the simulator) correctly autofills the Patient Report screen for that exact room.
- [ ] Live alert delivery confirmed working (Firestore `onSnapshot`, not a manual-refresh-only list) from patient submission through to the correctly-assigned Inspector's dashboard.
- [ ] Admin can edit hospital name/blocks/support email through Settings, with the change reflected across the app (e.g., a newly added block appears as a filter option) without a code deployment.
