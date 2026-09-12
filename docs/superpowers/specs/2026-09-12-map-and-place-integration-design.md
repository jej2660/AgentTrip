# Downhill Route Map and Place Integration Design

## Status

Approved direction for the first integration slice. The product owner asked the team to choose a practical approach, implement incrementally, and commit the result.

## Goal

Create the technical foundation for a mobile-first Downhill Route prototype that can display a real Dongincheon map and search real nearby places without becoming unusable when an API key or network request is unavailable.

This slice ends with a working map-and-place experience. Slope-aware pedestrian routing, elevation scoring, public transit, taxi prices, parking availability, and PM availability are separate follow-up slices.

## Decision

Use progressive enhancement with Kakao Maps JavaScript API:

- Render the Dongincheon map with Kakao Maps JavaScript SDK when `VITE_KAKAO_MAP_JAVASCRIPT_KEY` is configured for the deployed domain.
- Load Kakao's `services` library with the map SDK and use its browser place-search service. This avoids exposing a Kakao REST API key.
- Keep an in-repository Dongincheon sample catalog and route geometry as the deterministic demo fallback.
- Hide future secret-bearing APIs, including TMAP pedestrian routing, behind server-side provider adapters. Do not ship those credentials in Vite client variables.
- Offer a Kakao Map deep link from a selected place or sample course so a user can continue to Kakao's full navigation experience before native route calculation exists.

The official Kakao guide requires a JavaScript key and a registered domain, and documents the optional `services` library for place search and address conversion. It also documents map and route deep-link formats for walking, cycling, transit, and driving. TMAP is retained as the leading candidate for the later pedestrian-routing slice because its official product page lists pedestrian routing, waypoint optimization, place search, geocoding, and route matrices.

## Alternatives Considered

### 1. Progressive Kakao integration with demo fallback — selected

This provides a locally familiar map and place database while preserving a zero-key development mode. The application owns one normalized place type, so live and sample places render through the same components. It gives the project a usable first vertical slice without prematurely implementing the downhill optimizer.

### 2. Browser-only multi-provider integration

The client would call map, route, elevation, and weather providers directly. This is initially fast but would expose credentials intended to remain secret, spread provider-specific response types throughout the UI, and make failure handling inconsistent. Rejected.

### 3. MapLibre with public OpenStreetMap services only

This minimizes account setup, but public tile and geocoding services have usage policies that make them a poor default production dependency. Dongincheon place discovery would also require separate validation. This remains a possible future self-hosted fallback, not the first integration.

## Scope

### Included

- Vite, React, TypeScript, and Tailwind application foundation.
- Mobile-first place-selection screen centered on Dongincheon.
- Kakao SDK loader with explicit idle, loading, ready, and failed states.
- Kakao map adapter for markers, selected marker, viewport bounds, and route polyline overlays.
- Kakao place-search adapter using the SDK `services` library.
- Search results normalized into the same `Place` type as sample places.
- Sample place catalog for 수도국산 박물관, 자유공원, 신포시장, and 답동성당.
- Sample mixed-mode route geometry and segment metadata, visibly labeled as example data.
- A transport legend that combines color, line pattern, icon, and text.
- A Kakao Map deep link for viewing a selected destination or continuing with external directions.
- Accessible loading, empty, unavailable, and retry states.
- Tests for provider selection, data normalization, fallback behavior, and route/deep-link construction.

### Deferred

- Downhill route optimization and elevation-aware TSP.
- TMAP pedestrian routing or any other secret-bearing routing provider.
- Live elevation samples and slope calculations.
- Live public-transit itineraries.
- Taxi fare estimates, parking inventory, and PM inventory or geofences.
- Live weather-based rerouting.
- User accounts, persistence, analytics, and payments.

## Architecture

The UI consumes project-owned interfaces rather than Kakao objects directly.

```text
React screens
  ├─ PlaceSearchPanel
  ├─ MapSurface
  └─ RouteSummary
         │
         ▼
MapGateway / PlaceGateway
  ├─ KakaoMapAdapter + KakaoPlaceAdapter
  └─ DemoMapAdapter + SamplePlaceAdapter
         │
         ▼
Normalized Place, RouteSegment, Coordinate types
```

`MapGateway` owns map lifecycle and visual overlays. `PlaceGateway` owns keyword search. Neither interface exposes vendor SDK objects. A configuration resolver selects the Kakao implementation only when a key exists and the SDK loads successfully. Otherwise it selects the deterministic demo implementation.

Future server-side endpoints will implement separate `RouteGateway`, `ElevationGateway`, and `WeatherGateway` contracts. They are not created in this slice because no current screen consumes real responses from them.

## Proposed File Boundaries

```text
src/
  app/App.tsx
  app/App.test.tsx
  features/places/PlaceSearchPanel.tsx
  features/places/PlaceSearchPanel.test.tsx
  features/places/placeTypes.ts
  features/places/samplePlaces.ts
  features/map/MapSurface.tsx
  features/map/MapSurface.test.tsx
  features/map/mapTypes.ts
  features/map/createMapGateway.ts
  features/map/demoMapGateway.ts
  features/map/kakao/loadKakaoMaps.ts
  features/map/kakao/kakaoMapGateway.ts
  features/map/kakao/kakaoPlaceGateway.ts
  features/route/RouteLegend.tsx
  features/route/RouteSummary.tsx
  features/route/sampleRoute.ts
  lib/kakaoLinks.ts
  lib/kakaoLinks.test.ts
```

Each file owns one concern. UI components receive normalized data and callback props. Kakao-specific global types and SDK calls remain inside `features/map/kakao`.

## Core Types

```ts
type Coordinate = {
  latitude: number;
  longitude: number;
};

type PlaceSource = "kakao" | "sample";

type Place = {
  id: string;
  name: string;
  coordinate: Coordinate;
  categoryName: string;
  address: string;
  roadAddress?: string;
  source: PlaceSource;
  externalUrl?: string;
};

type TransportMode = "walk" | "transit" | "taxi" | "bicycle" | "pm";

type RouteSegment = {
  id: string;
  mode: TransportMode;
  fromPlaceId: string;
  toPlaceId: string;
  minutes: number;
  path: Coordinate[];
  slopeLabel: "uphill" | "flat" | "downhill" | "unknown";
  source: "sample";
};
```

The first slice keeps `RouteSegment.source` fixed to `sample`. A later routing design may widen the union after real route provenance and error semantics are defined.

## Data Flow

1. The application resolves configuration at startup.
2. If a Kakao JavaScript key exists, the loader requests the SDK with `libraries=services` and `autoload=false`.
3. When the SDK is ready, `KakaoMapGateway` creates the map centered on Dongincheon and `KakaoPlaceGateway` becomes available.
4. A user enters a keyword. The place gateway searches within or near the current map bounds and normalizes successful results to `Place[]`.
5. The place panel merges live results with curated sample recommendations without duplicating the same place name and coordinate.
6. Selecting a place updates the selected marker and summary through React state.
7. Selecting the sample course draws each route segment with a mode-specific line treatment and fits the map to the complete path.
8. If the SDK cannot load or the search fails, the UI preserves the current selection, switches place discovery to sample data, and shows a retry action.

## Configuration and Credential Rules

- `VITE_KAKAO_MAP_JAVASCRIPT_KEY` is the only provider configuration read by client code in this slice.
- The key must be restricted to approved development and deployment domains in Kakao Developers.
- `.env` remains ignored. `.env.example` documents the variable name without a credential.
- No Kakao REST key, TMAP app key, or other secret may use the `VITE_` prefix.
- Future secret-bearing integrations use server-side environment variables and same-origin `/api/*` functions.
- Logs and UI errors never include credentials or full upstream request headers.

## UI States

- **Demo:** No Kakao key. Show the sample map treatment, curated places, and an “예시 데이터” label.
- **Loading:** Reserve the final map height and announce “동인천 지도를 불러오고 있어요.”
- **Ready:** Show the live Kakao map, search field, curated recommendations, transport legend, and sample course.
- **Search empty:** Keep the map visible and suggest a broader term or a curated place.
- **Unavailable:** Keep all selected places and the sample route usable, explain that the live map is temporarily unavailable, and offer retry.
- **External navigation:** Open a Kakao Map deep link only from an explicit user action.

## Accessibility

- The map is supplemental; every selected place and route segment also appears in an ordered text list.
- Transport modes differ by label, icon, color, and line pattern.
- Search results are keyboard reachable and expose selection state.
- Status changes use a polite live region without repeatedly announcing map pan and zoom events.
- Touch targets are at least 44 by 44 CSS pixels.
- The sample fallback contains the same essential actions as the live map state.

## Error Handling

- SDK loader failures are cached for the current load attempt and may be retried explicitly.
- Concurrent loader callers share one promise so the SDK script is not inserted twice.
- Search requests discard stale responses when a later query finishes first.
- Vendor status codes are converted into project-owned error categories: `configuration`, `network`, `quota`, `no-results`, and `unknown`.
- Errors do not clear a user's selected places.
- The UI never presents sample route metrics as live calculations.

## Testing

- Unit-test configuration resolution with and without a Kakao key.
- Unit-test Kakao result normalization using fixture objects at the adapter boundary.
- Unit-test deep links for Unicode place names and WGS84 coordinate order.
- Unit-test that missing configuration selects the demo gateway.
- Component-test loading, ready, empty, unavailable, retry, and selected-place states.
- Component-test that each transport segment has a text label and non-color distinction.
- Run a production build to verify TypeScript and bundle integration.
- Run one browser smoke test in demo mode without a key. When a real key is supplied, manually verify the registered deployment domain and live place search without recording the key.

## Acceptance Criteria

1. The app starts and remains useful without any map credential.
2. With a valid domain-restricted Kakao JavaScript key, the app displays a live map centered on Dongincheon.
3. A user can search Kakao places, select a result, and see its marker and text summary.
4. A user can choose the sample four-place course and see its segments on the map and in an ordered list.
5. Route segments are distinguishable without color alone.
6. Live-map or search failure does not discard the current course or block the sample experience.
7. A user can explicitly open the selected destination or sample course in Kakao Map.
8. No secret-bearing credential is present in the client bundle or repository.

## Follow-up Slices

1. Add a server-side TMAP pedestrian-route adapter and normalize returned geometry.
2. Add elevation sampling and calculate slope-aware energy cost for each walking segment.
3. Add route-order optimization across selected places and personas.
4. Add Open-Meteo weather input and safety rules for rain, heat, cold, and wind.
5. Add transit, taxi, parking, and PM providers only after their data availability and terms are validated.

## Primary References

- [Kakao Maps Web API guide](https://apis.map.kakao.com/web/guide/)
- [Kakao Maps Web API documentation](https://apis.map.kakao.com/web/documentation)
- [TMAP API product overview](https://www.tmapmobility.com/service/corporate/api)
- [Open-Meteo forecast API](https://open-meteo.com/en/docs)
