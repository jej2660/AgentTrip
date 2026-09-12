# Downhill Route - Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the complete project skeleton for Downhill Route including Next.js, TypeScript strict mode, Tailwind CSS, Vitest, Zod, directory layout, `.env.example`, documentation files (`PRD.md`, `decisions.md`, `integrations.md`, `README.md`), and ensure clean builds.

**Architecture:** Next.js App Router project initialized with pnpm, Tailwind, and Vitest testing framework. Core domain interfaces, seed files skeleton, and environment configurations established according to Section 13 repository structure.

**Tech Stack:** Next.js, React, TypeScript (`strict`), Tailwind CSS, Vitest, Zod, `@anthropic-ai/sdk`, `@upstash/redis`

**Spec:** `docs/superpowers/specs/2026-09-12-downhill-route-design.md`

## Global Constraints

- Must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Environment variable rules: `NEXT_PUBLIC_` prefix ONLY for `NEXT_PUBLIC_KAKAO_JS_KEY`. All backend keys stay server-only.
- All code, identifiers, and comments in English; UI copy in Korean.

---

### Task 1: Initialize Next.js Project & Config Files

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `postcss.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`
- Modify: `README.md`
- Docs: `docs/PRD.md`, `docs/decisions.md`, `docs/integrations.md`

- [ ] **Step 1: Scaffolding package.json and dependencies**
  Install Next.js, React, TypeScript, TailwindCSS, Zod, Vitest, `@anthropic-ai/sdk`, `@upstash/redis`.

- [ ] **Step 2: Configure TypeScript, Tailwind, Vitest, and Next.js**
  Setup `tsconfig.json` with strict mode and `@/*` path aliases. Configure Vitest for unit tests.

- [ ] **Step 3: Create Documentation and Environment Examples**
  Write `.env.example`, `README.md`, `docs/PRD.md`, `docs/decisions.md`, and `docs/integrations.md`.

- [ ] **Step 4: Verify Lint, Typecheck, Test, and Build**
  Run verification commands to ensure zero errors.

---

### Task 2: Project Directory Structure & Domain Skeleton

**Files:**
- Create: `lib/domain/types.ts`, `lib/domain/schema.ts`, `app/layout.tsx`, `app/page.tsx`, `app/plan/page.tsx`, `app/result/[planId]/page.tsx`

- [ ] **Step 1: Define Domain Types in `lib/domain/types.ts`**
  Implement exact interfaces specified in Section 3 of the prompt (`Mode`, `PersonaId`, `Weather`, `PoiCategory`, `LatLng`, `Poi`, `RouteRequest`, `Leg`, `Metrics`, `Savings`, `InvariantReport`, `RoutePlan`, `PlanJob`).

- [ ] **Step 2: Define Zod Schemas in `lib/domain/schema.ts`**
  Implement Zod schemas for input validation (`RouteRequestSchema`, `PoiSchema`, etc.).

- [ ] **Step 3: Create Initial App Router Pages Skeleton**
  Create basic `/`, `/plan`, `/result/[planId]` pages in `app/`.

- [ ] **Step 4: Test Types and Schema Validation**
  Add unit tests in `tests/domain/schema.test.ts` to verify Zod validations.
