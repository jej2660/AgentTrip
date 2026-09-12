# Decision Log (`docs/decisions.md`)

## 2026-09-12 Phase 0 Architecture Defaults & Assumptions

1. **Tech Stack Defaults Accepted:**
   - **Framework:** Next.js (App Router) + TypeScript (`strict`) + Tailwind CSS + Vitest + Zod
   - **LLM SDK:** Direct `@anthropic-ai/sdk` Messages API with tool use & streaming
   - **KV Store:** Upstash Redis (`@upstash/redis`) for session & plan storage (TTL 7 days)
   - **Map SDK:** Kakao Maps JS SDK wrapped behind `MapAdapter` interface
   - **Directions Provider:** OpenRouteService (ORS) Directions (`foot-walking`, `driving-car`) with elevation fallback

2. **Package Manager & Tooling:**
   - Defaulted to `npm` as system package manager in local environment.

3. **Fallback & Resiliency Policies:**
   - Dual fallback chain: Real API -> Approx Provider; LLM Agent Failure -> Engine Direct Execution (`plan.ts`).
