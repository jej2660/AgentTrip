# Downhill Route - Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic engine core, seed data, pure engine pure functions, unit test suite covering Section 14 demo scenarios 1–5, synchronous API routes (`POST /api/route`, `GET /api/regions/:id/pois`), and the UI Wizard / Result view.

**Architecture:** Pure function deterministic cost engine (`lib/engine/*`), approx route provider (`lib/providers/approx.ts`), seed POIs for Dongincheon (`lib/data/regions/dongincheon/*`), Next.js Route Handlers (`app/api/*`), and mobile-first UI components (`components/*`, `app/plan/page.tsx`, `app/result/[planId]/page.tsx`).

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-12-downhill-route-design.md`

## Global Constraints

- Must pass `npm run typecheck`, `npm test`, `npm run build`.
- Pure functions in engine core (no network/time/random/LLM dependencies).
- Verification tests for Section 14 scenarios 1–5 must pass under engine execution.

---

### Task 1: Seed Data & POI Enrichment Scripts

**Files:**
- Create: `lib/data/regions/dongincheon/pois.json`
- Create: `lib/data/regions/dongincheon/parkings.json`
- Create: `lib/data/regions/dongincheon/themes.json`
- Create: `scripts/verify-pois.ts`
- Create: `scripts/enrich-elevation.ts`

- [ ] **Step 1: Write seed data JSON files for Dongincheon**
  Add realistic, verified POIs (Dongincheon Station, Jayu Park, Sinpo International Market, Dapdong Cathedral, Songhyeon Park, Chinatown, etc.) with coordinates, categories, stay times, and initial elevations.

- [ ] **Step 2: Create verify-pois and enrich-elevation scripts**
  Implement idempotent helper scripts for POI validation and elevation enrichment.

- [ ] **Step 3: Test seed data loading**
  Add a test `tests/data/seed.test.ts` verifying seed JSON structures.

---

### Task 2: Deterministic Engine Core & Pure Cost Functions

**Files:**
- Create: `lib/engine/config.ts`
- Create: `lib/engine/effort.ts`
- Create: `lib/engine/modes.ts`
- Create: `lib/engine/personas.ts`
- Create: `lib/engine/matrix.ts`
- Create: `lib/engine/invariants.ts`
- Create: `lib/engine/labels.ts`
- Create: `lib/providers/RouteProvider.ts`
- Create: `lib/providers/approx.ts`

- [ ] **Step 1: Implement `config.ts` and `effort.ts`**
  Implement Naismith/grade-based effort calculation (§5.2) and Tobler hiking function for walk duration (§5.3).

- [ ] **Step 2: Implement `modes.ts` and `personas.ts`**
  Implement transport mode eligibility and cost formulas (§5.4, §5.5) and persona parameter definitions (§4).

- [ ] **Step 3: Implement `invariants.ts` and `labels.ts`**
  Implement hard rule checks (`UPHILL_WALK`, `WALK_TOO_LONG`, `STAIRS`, `TURTLE_TAXI`, `NO_MODE`, `PM_RAIN`) and leg label formatting (§6.6).

- [ ] **Step 4: Implement RouteProvider interface and Approx Provider (`approx.ts`)**
  Mathematical approximation provider calculating distance, elevation gain/loss, duration, and geometry interpolation.

- [ ] **Step 5: Write unit tests for cost engine & effort**
  Create `tests/engine/effort.test.ts` and `tests/engine/modes.test.ts`.

---

### Task 3: Engine Solver, Basecamp, Sloth Skip, Report & Orchestrator

**Files:**
- Create: `lib/engine/basecamp.ts`
- Create: `lib/engine/sloth.ts`
- Create: `lib/engine/report.ts`
- Create: `lib/engine/profile.ts`
- Create: `lib/engine/solver.ts`
- Create: `lib/engine/plan.ts`

- [ ] **Step 1: Implement `solver.ts` (3-stage pipeline)**
  Stage A (approx matrix), Stage B (permutation search, max 8 POIs), Stage C (re-validation).

- [ ] **Step 2: Implement `basecamp.ts`, `sloth.ts`, `report.ts`, `profile.ts`**
  Basecamp loop strategy logic, Sloth effort budget skip logic, baseline comparison & savings report, elevation profile points.

- [ ] **Step 3: Implement `plan.ts` (Engine Orchestrator)**
  Main entry point `generateEnginePlan(request: RouteRequest)` connecting all engine modules.

- [ ] **Step 4: Write unit tests for solver, sloth, basecamp, and Section 14 Demo Scenarios 1–5**
  Create `tests/engine/solver.test.ts` and `tests/engine/scenarios.test.ts`.

---

### Task 4: API Route Handlers (`POST /api/route`, `GET /api/regions/:id/pois`)

**Files:**
- Create: `app/api/regions/[id]/pois/route.ts`
- Create: `app/api/route/route.ts`
- Create: `tests/api/route.test.ts`

- [ ] **Step 1: Implement `GET /api/regions/[id]/pois/route.ts`**
  Return POIs, parkings, and themes for the specified region.

- [ ] **Step 2: Implement `POST /api/route/route.ts`**
  Validate input with `RouteRequestSchema`, execute `generateEnginePlan`, handle errors gracefully, return `RoutePlan`.

- [ ] **Step 3: Write API tests in `tests/api/route.test.ts`**
  Verify input validation (e.g. >8 POIs rejection, invalid bbox, missing walk mode) and 200 response structure.

---

### Task 5: UI Components & Wizard / Result Pages

**Files:**
- Create: `components/map/MapAdapter.ts`
- Create: `components/map/KakaoMap.tsx`
- Create: `components/plan/CarStep.tsx`
- Create: `components/plan/PoiStep.tsx`
- Create: `components/plan/ModeStep.tsx`
- Create: `components/plan/PersonaStep.tsx`
- Create: `components/result/SummaryCards.tsx`
- Create: `components/result/ElevationProfile.tsx`
- Create: `components/result/LegList.tsx`
- Create: `components/result/PersonaSays.tsx`
- Modify: `app/plan/page.tsx`
- Modify: `app/result/[planId]/page.tsx`

- [ ] **Step 1: Create MapAdapter interface and KakaoMap wrapper component**
  Map rendering component supporting markers, polylines, and elevation profile interaction.

- [ ] **Step 2: Build Wizard Step Components (`CarStep`, `PoiStep`, `ModeStep`, `PersonaStep`)**
  Interactive mobile UI components for step-by-step route customization.

- [ ] **Step 3: Build Result View Components (`SummaryCards`, `ElevationProfile`, `LegList`, `PersonaSays`)**
  Display savings metrics, elevation charts, step-by-step guidance cards, and persona explanations.

- [ ] **Step 4: Wire `/plan` wizard and `/result/[planId]` pages**
  Store request state in query/session and connect to `/api/route`.

- [ ] **Step 5: Full Verification**
  Run `npm run typecheck && npm test && npm run build` to verify Phase 1 completion.
