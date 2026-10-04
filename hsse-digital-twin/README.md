# Smart HSSE 3D Digital Twin — Tower-A

An isometric, strategy-game-style digital twin of a construction site with live HSSE overlays: zone status glows, Permit-to-Work (PTW) management, pre-use inspection checklists, hazard reporting, stop-work notices and a site activity feed. All data is mocked and runs entirely in the browser.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest: status rules + store actions
npm run lint     # oxlint
npm run build    # tsc + vite build
```

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| App | Vite + React 19 + TypeScript | Client-only WebGL app, so SSR adds nothing. Next.js would need `dynamic(..., { ssr: false })` around the canvas anyway. |
| 3D | React Three Fiber + drei | Spline needs a scene authored and hosted in the Spline editor, and none exists. Procedural R3F geometry keeps the twin data-driven: permits and hazards change what the 3D scene does. |
| UI | Tailwind v4, shadcn/ui (Radix), Lucide | shadcn primitives live in `src/components/ui`. The registry was unreachable from the build environment, so they were written by hand. `components.json` is configured, so `npx shadcn add …` works later. |
| Motion | Framer Motion | `MotionConfig reducedMotion="user"` respects OS settings. Camera transitions are disabled under reduced motion. |
| State | Zustand | One store holds all actions. Derived values are computed, never stored. |

## Layout

```
src/
  data/mock-data.ts      siteMetrics, zones, permits, observations, telemetry, auditFeed, hazardScenarios
  data/types.ts
  lib/status.ts          status derivation, filter + permit-approval rules (unit tested)
  store/site-store.ts    actions: approve, flag, close, stop-work, lift, simulate, tick (unit tested)
  components/scene/      R3F scene: board, Tower-A, scaffold, crane, truck, excavation, workers, zone overlays, camera
  components/hud/        header, KPI cards, inspection panel, activity ticker, toasts, map controls
  components/ui/         shadcn primitives
```

## Status rules

Zone colour is **derived** from the records on every render (`deriveZoneStatus`):

| Colour | When |
| --- | --- |
| 🔴 Critical | Stop-work notice in force, or an open **critical** observation |
| 🟠 Caution | Open medium/high observation, a permit pending or suspended, or a failed pre-use check |
| 🟢 Clear | Otherwise. Low-severity hazard-hunt items are tracked but don't flag the zone. |

## Safety-logic decisions (where this deviates from or tightens the SOW)

1. **Risk assessment ≠ status.** The SOW maps Green/Amber/Red onto both "risk level" and live status. They are different things: a scaffold is inherently *High* risk (work at height) yet can be fully compliant (*green*). The panel shows both.
2. **Counts are derived, not stored.** `siteMetrics` has no active-permits or open-hazards count. Those come from `permits` and `observations`, so the KPIs can't disagree with the map.
3. **Approve Permit is gated.** It stays disabled, with the reason shown, until every pre-use check passes, there is no stop-work, and there is no open critical hazard. The seed lifting permit `PTW-2026-093` is blocked on an unsigned lift plan. ⚠️ A real system also needs authenticated sign-off by an authorised issuer. This mock has no identity, so treat the button as a demo, not a control.
4. **Stop-work is never gated, but lifting it is.** Anyone can issue one (after a confirm dialog). Lifting requires the critical hazard to be closed first. Suspended permits return to **pending** for re-approval and are never silently re-activated.
5. **Closing an alarm doesn't re-pass the check.** After an H₂S alarm the reading returns to normal, but the gas-test item stays FAILED until someone re-verifies it.
6. **Filters never dim a red zone.** "High-Risk Only" or "Active Permits" fade non-matching zones, except critical ones.
7. **Gamification rewards closure, not silence.** There is no composite "safety score", and no reward for low incident counts, because both are known to suppress near-miss reporting. The hazards KPI shows *open* items and *closed this shift*. The crane is itself a status indicator: it slews only with an active lifting permit, and the hot-work sparks, crew figures and permit-gated telemetry (entrants, hook load) appear and disappear with the permit state.
8. **Orange ≠ amber.** Brand orange `#f97316` and caution amber `#f59e0b` are close hues, so orange is reserved for action buttons. The scene itself is neutral (no yellow crane) so the only saturated colours on the map are status.
9. **The feed doesn't auto-scroll** (WCAG 2.2.2). It is a horizontally scrollable strip, newest first.

## Try it

Open **Simulate** in the header:

- **Wind gust over crane limit / H₂S alarm** create critical observations, force the related telemetry out of range, and fail the related check.
- Click the red zone → **Stop-Work** → close the hazard → re-verify the failed check → **Lift Stop** → re-approve the permit.
- **TC-1:** mark *Lift plan countersigned* as passed, then **Approve** to start the crane's pick-and-place cycle.

Camera: drag to orbit, scroll to zoom, right-drag to pan. The ↺ ↻ buttons rotate in 90° steps and ⌂ returns to true isometric. Esc closes the panel. Sound cues are muted by default (speaker icon).

## Known limitations

- Mock data only. State resets on reload, and there is no backend, auth or real sensor feed.
- The 3D chunk is ~270 kB gzip (mostly three.js). It is lazy-loaded so the HUD paints first.
- `backdrop-blur` over a live WebGL canvas costs GPU time on low-end devices. Verified only in headless Chromium with software WebGL; not profiled on real mobile hardware.
- The console shows a `THREE.Clock` deprecation warning from inside R3F (not this code).
