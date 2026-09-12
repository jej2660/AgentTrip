# Downhill Route (내리막 중심 체력 아낌 길찾기) Design Specification

**Date:** 2026-09-12
**Status:** Approved
**Target Platform:** Vercel

## 1. Overview
Downhill Route is a mobile-first web service designed to minimize physical exertion during sightseeing in hilly or elevated tourist areas (starting with Dongincheon). By strategically utilizing taxis/buses to reach high points first and walking downhill, the service optimizes visit order and transport modes based on slope, transport modes, persona budgets, and weather.

## 2. System Architecture & Component Design

```
[ Client (Mobile Web / Next.js UI) ]
             |
             | HTTP POST /api/plans (SSE Stream)
             v
[ API Route Handler / Engine Controller ]
             |
             +---> [ Cache Check (KV / Upstash Redis) ]
             |
             +---> [ Agent Loop (Anthropic Claude API) ]
             |            |
             |            +---> Tools: generate_plans, adjust_plan, get_poi_details, finalize_plan
             |            v
             +---> [ Deterministic Engine (Pure Functions) ]
                          |
                          +---> Cost Engine & Effort Calculation (§5)
                          +---> Solver & Permutation Search (§6)
                          +---> Basecamp Loop & Sloth Skip Logic
                          +---> Invariant Report & Baseline Comparison
```

## 3. Technology Stack
- **Framework:** Next.js (App Router), TypeScript (`strict`), Tailwind CSS, pnpm
- **LLM Runtime:** Anthropic Messages API (`@anthropic-ai/sdk`) with tool use & streaming
- **KV Store:** Upstash Redis (`@upstash/redis`) / Vercel KV
- **Map SDK:** Kakao Maps JS SDK with `MapAdapter` interface
- **Directions & Elevation:** OpenRouteService (ORS) API + Approx Fallback
- **Validation & Testing:** Zod, Vitest

## 4. Phase Breakdown
- **Phase 0: Skeleton & Configuration**
  - Next.js setup, TS, Tailwind, Vitest, Zod, directory structure, docs & `.env.example`.
- **Phase 1: Deterministic Engine & Sync API**
  - Seed POIs, Pure Cost Engine, Solver, Baseline Report, `/api/route` & UI Wizard.
- **Phase 2: LLM Agent & Streaming**
  - Tool wrappers, Agent Runtime, SSE streaming, KV job store, rate limits, `/result/[planId]`.
- **Phase 3: Real Directions & Advanced Features**
  - ORS directions integration, weather toggle, turtle rest stops, Kakao Map deep links.
- **Phase 4: Extensions**
  - Public transit details, freeform re-adjustment, multi-region support.

## 5. Security & Fallback Guarantees
- No secrets exposed to client (`NEXT_PUBLIC_` only for Kakao JS key).
- User inputs sanitized and wrapped in XML tags in prompts; strict Zod output validation.
- Double fallback strategy: Real API -> Approx Provider; LLM Failure -> Engine Direct Execution.
