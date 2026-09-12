# External API & Integration Documentation (`docs/integrations.md`)

## 1. Anthropic Messages API
- **SDK:** `@anthropic-ai/sdk`
- **Features:** Tool use, streaming
- **Model:** Specified via `AGENT_MODEL` environment variable (e.g. `claude-3-5-sonnet-20241022`)
- **Timeout & Limits:** Controlled server-side via `AGENT_TIMEOUT_MS` (45000ms) and `AGENT_MAX_STEPS` (8).

## 2. Upstash Redis / KV Store
- **SDK:** `@upstash/redis`
- **Key Expiry:** Plan data stored with TTL of 7 days (`604800` seconds).

## 3. Kakao Maps JavaScript & REST API
- **Local REST API:** Server-side POI verification & Geocoding.
- **Maps JS SDK:** Client-side rendering wrapped behind `MapAdapter`.
- **Domain Registration:** Localhost & Vercel deployment domains registered in Kakao Developer Console.

## 4. OpenRouteService (ORS) Directions API
- **Endpoints:** `foot-walking`, `driving-car`
- **Options:** Elevation, steepness/waytype extra info
- **Fallback:** Mathematical approximation provider (`approx.ts`) when API key is missing or request fails.
