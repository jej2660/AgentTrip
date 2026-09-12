# Downhill Route Map and Place Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a mobile-first Downhill Route prototype that displays a live Kakao map and Kakao place results when configured, while remaining fully usable with clearly labeled Dongincheon sample data without a key.

**Architecture:** React screens consume project-owned `PlaceGateway` and `MapGateway` interfaces. Kakao SDK objects stay inside `features/map/kakao`; demo gateways and sample route data implement the same contracts. GitHub Pages publishes the production build so the prototype is reachable without localhost.

**Tech Stack:** Node.js 22.12 or newer, Vite, React, TypeScript, Tailwind CSS with `@tailwindcss/vite`, Vitest, jsdom, React Testing Library, Kakao Maps JavaScript SDK, GitHub Actions, and GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-12-map-and-place-integration-design.md`

## Global Constraints

- Keep the first slice limited to live map rendering, live place search, sample route display, and external Kakao Map links.
- Treat 수도국산 박물관, 자유공원, 신포시장, 답동성당, all route geometry, `82%`, `₩1,500`, and `1시간 45분` as example data rather than live calculations.
- Use `VITE_KAKAO_MAP_JAVASCRIPT_KEY` as the only client provider credential and document domain restriction.
- Never expose a Kakao REST key, TMAP key, request headers, or credential values in client code, tests, logs, or commits.
- Preserve a complete demo experience when the key is missing, the SDK fails, or place search is unavailable.
- Keep Kakao-specific types and behavior within `src/features/map/kakao`.
- Use Korean interface copy, 44-by-44 CSS pixel minimum touch targets, visible focus styles, polite status announcements, and non-color route distinctions.
- Use Tailwind CSS through its Vite plugin and `@import "tailwindcss"`; do not add a legacy Tailwind configuration file.
- Support the modern browser floor required by Tailwind CSS v4: Safari 16.4+, Chrome 111+, and Firefox 128+.

## File Structure

```text
.github/workflows/deploy-pages.yml        # test, build, and GitHub Pages deployment
.env.example                              # local non-secret variable names
README.md                                 # setup, key registration, demo mode, deployment
index.html                                # Vite HTML entry
package.json                              # scripts and dependency manifest
package-lock.json                         # reproducible npm dependency graph
tsconfig.json                             # project reference root
tsconfig.app.json                         # browser TypeScript options
tsconfig.node.json                        # Vite configuration TypeScript options
vite.config.ts                            # React, Tailwind, Vitest, and Pages base config
src/main.tsx                              # React mount point
src/index.css                             # Tailwind import, product tokens, base styles
src/vite-env.d.ts                         # Vite and Kakao environment declarations
src/test/setup.ts                         # Testing Library matchers and cleanup
src/config/runtimeConfig.ts               # demo/live mode resolution
src/config/runtimeConfig.test.ts          # configuration contract tests
src/app/App.tsx                           # screen composition and selected-place state
src/app/App.test.tsx                      # complete demo flow tests
src/features/places/placeTypes.ts         # normalized place and error contracts
src/features/places/samplePlaces.ts       # deterministic Dongincheon recommendations
src/features/places/samplePlaceGateway.ts # fallback keyword search
src/features/places/PlaceSearchPanel.tsx  # search, empty, error, retry, selection UI
src/features/places/PlaceSearchPanel.test.tsx
src/features/map/mapTypes.ts              # map gateway contracts
src/features/map/MapSurface.tsx           # live-map lifecycle and demo fallback
src/features/map/MapSurface.test.tsx
src/features/map/DemoMap.tsx              # accessible schematic route fallback
src/features/map/createMapGateway.ts       # live gateway construction
src/features/map/kakao/kakaoMaps.types.ts # minimal SDK types used by the app
src/features/map/kakao/loadKakaoMaps.ts    # singleton SDK loader with explicit reset
src/features/map/kakao/loadKakaoMaps.test.ts
src/features/map/kakao/kakaoPlaceGateway.ts
src/features/map/kakao/kakaoPlaceGateway.test.ts
src/features/map/kakao/kakaoMapGateway.ts # markers, polylines, bounds, cleanup
src/features/route/routeTypes.ts           # normalized route contracts
src/features/route/sampleRoute.ts          # labeled mixed-mode example route
src/features/route/RouteLegend.tsx         # color, line, icon, and text legend
src/features/route/RouteSummary.tsx        # metrics and ordered route list
src/lib/kakaoLinks.ts                      # encoded map and walking-route deep links
src/lib/kakaoLinks.test.ts
```

---

### Task 1: Bootstrap the Tested Vite Application

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Create: `src/config/runtimeConfig.test.ts`
- Create: `src/config/runtimeConfig.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/app/App.tsx`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `ImportMetaEnv` supplied by Vite.
- Produces: `RuntimeConfig`, `resolveRuntimeConfig(env)`, a mounted React application, and the shared test/build toolchain.

- [ ] **Step 1: Install the application and test dependencies**

Run:

```bash
npm init -y
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom
npm pkg set type=module
npm pkg set scripts.dev=vite
npm pkg set scripts.build="tsc -b && vite build"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch=vitest
npm pkg set scripts.preview="vite preview"
```

Expected: `package.json` and `package-lock.json` exist. `npm ls --depth=0` exits successfully.

- [ ] **Step 2: Add the Vite, TypeScript, Tailwind, and Vitest configuration**

Use these exact configuration decisions:

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/AgentTrip/" : "/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

Add `node_modules/`, `dist/`, and `coverage/` to `.gitignore`. Set `lang="ko"`, the viewport meta tag, the title `Downhill Route`, and `<div id="root"></div>` in `index.html`. Configure `tsconfig.app.json` for strict JSX browser code and `tsconfig.node.json` for `vite.config.ts`.

- [ ] **Step 3: Write failing tests for configuration and the app shell**

```ts
// src/config/runtimeConfig.test.ts
import { describe, expect, it } from "vitest";
import { resolveRuntimeConfig } from "./runtimeConfig";

describe("resolveRuntimeConfig", () => {
  it("uses demo mode when no Kakao key is configured", () => {
    expect(resolveRuntimeConfig({})).toEqual({ mapMode: "demo" });
  });

  it("uses Kakao mode with a trimmed JavaScript key", () => {
    expect(
      resolveRuntimeConfig({ VITE_KAKAO_MAP_JAVASCRIPT_KEY: "  public-js-key  " }),
    ).toEqual({ mapMode: "kakao", kakaoJavaScriptKey: "public-js-key" });
  });
});
```

```tsx
// src/app/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("introduces the Dongincheon downhill route", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "올라갈 땐 타고, 내려올 땐 걷자." }),
    ).toBeInTheDocument();
    expect(screen.getByText("동인천 내리막 코스")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `runtimeConfig.ts` and `App.tsx` do not exist.

- [ ] **Step 5: Implement the minimal configuration and app shell**

```ts
// src/config/runtimeConfig.ts
export type RuntimeConfig =
  | { mapMode: "demo" }
  | { mapMode: "kakao"; kakaoJavaScriptKey: string };

export function resolveRuntimeConfig(
  env: Record<string, string | boolean | undefined>,
): RuntimeConfig {
  const key = env.VITE_KAKAO_MAP_JAVASCRIPT_KEY;
  if (typeof key !== "string" || key.trim() === "") {
    return { mapMode: "demo" };
  }
  return { mapMode: "kakao", kakaoJavaScriptKey: key.trim() };
}
```

```tsx
// src/app/App.tsx
export function App() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <p className="text-sm font-bold text-route-blue">동인천 내리막 코스</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
        올라갈 땐 타고, 내려올 땐 걷자.
      </h1>
    </main>
  );
}
```

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-paper: #f4ead2;
  --color-paper-soft: #fffaf0;
  --color-ink: #17231c;
  --color-route-blue: #174b8c;
  --color-action: #e55828;
  --color-route-green: #2c7657;
}

@layer base {
  :focus-visible {
    outline: 3px solid var(--color-route-blue);
    outline-offset: 3px;
  }
  button,
  a,
  input {
    min-height: 44px;
  }
}
```

- [ ] **Step 6: Verify GREEN and build**

Run: `npm test && npm run build`

Expected: 3 tests pass and Vite writes a production bundle to `dist/`.

- [ ] **Step 7: Commit the tested application foundation**

```bash
git add .gitignore package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts src
git commit -m "feat: bootstrap Downhill Route web app"
```

---

### Task 2: Define Places, Sample Route Data, and Kakao Deep Links

**Files:**
- Create: `src/features/places/placeTypes.ts`
- Create: `src/features/places/samplePlaces.ts`
- Create: `src/features/places/samplePlaceGateway.ts`
- Create: `src/features/route/routeTypes.ts`
- Create: `src/features/route/sampleRoute.ts`
- Create: `src/lib/kakaoLinks.test.ts`
- Create: `src/lib/kakaoLinks.ts`

**Interfaces:**
- Consumes: no provider SDK.
- Produces: `Coordinate`, `Place`, `PlaceGateway`, `PlaceSearchError`, `RouteSegment`, `samplePlaces`, `sampleRoute`, `createKakaoPlaceLink(place)`, and `createKakaoWalkRouteLink(places)`.

- [ ] **Step 1: Write failing tests for sample search and Kakao links**

```ts
// src/lib/kakaoLinks.test.ts
import { describe, expect, it } from "vitest";
import { samplePlaces } from "../features/places/samplePlaces";
import { createKakaoPlaceLink, createKakaoWalkRouteLink } from "./kakaoLinks";

describe("Kakao links", () => {
  it("encodes a Korean place name and keeps latitude before longitude", () => {
    const url = decodeURI(createKakaoPlaceLink(samplePlaces[0]).toString());
    expect(url).toContain("수도국산 박물관,37.4771,126.6367");
  });

  it("builds a walking route for the four sample places", () => {
    const url = decodeURI(createKakaoWalkRouteLink(samplePlaces).toString());
    expect(url).toContain("/link/by/walk/");
    expect(url).toContain("수도국산 박물관");
    expect(url).toContain("답동성당");
  });

  it("rejects route links with fewer than two places", () => {
    expect(() => createKakaoWalkRouteLink([samplePlaces[0]])).toThrow(
      "Kakao walking links require 2 to 7 places",
    );
  });
});
```

Add a test beside `samplePlaceGateway.ts` that searches `시장`, receives 신포시장, searches an unmatched term, and receives an empty array.

- [ ] **Step 2: Run the targeted tests and verify RED**

Run: `npm test -- src/lib/kakaoLinks.test.ts src/features/places/samplePlaceGateway.test.ts`

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Add the normalized domain contracts**

```ts
// src/features/places/placeTypes.ts
export type Coordinate = { latitude: number; longitude: number };
export type PlaceSource = "kakao" | "sample";
export type PlaceSearchErrorKind =
  | "configuration"
  | "network"
  | "quota"
  | "no-results"
  | "unknown";

export type Place = {
  id: string;
  name: string;
  coordinate: Coordinate;
  categoryName: string;
  address: string;
  roadAddress?: string;
  source: PlaceSource;
  externalUrl?: string;
};

export class PlaceSearchError extends Error {
  constructor(public readonly kind: PlaceSearchErrorKind, message: string) {
    super(message);
    this.name = "PlaceSearchError";
  }
}

export interface PlaceGateway {
  search(keyword: string): Promise<Place[]>;
}
```

```ts
// src/features/route/routeTypes.ts
import type { Coordinate } from "../places/placeTypes";

export type TransportMode = "walk" | "transit" | "taxi" | "bicycle" | "pm";
export type SlopeLabel = "uphill" | "flat" | "downhill" | "unknown";

export type RouteSegment = {
  id: string;
  mode: TransportMode;
  fromPlaceId: string;
  toPlaceId: string;
  minutes: number;
  path: Coordinate[];
  slopeLabel: SlopeLabel;
  source: "sample";
};
```

- [ ] **Step 4: Add deterministic sample places and route segments**

Use these labeled sample coordinates:

```ts
// src/features/places/samplePlaces.ts
import type { Place } from "./placeTypes";

export const samplePlaces: Place[] = [
  { id: "sudoguksan", name: "수도국산 박물관", coordinate: { latitude: 37.4771, longitude: 126.6367 }, categoryName: "박물관", address: "인천 동구", source: "sample" },
  { id: "jayugongwon", name: "자유공원", coordinate: { latitude: 37.4758, longitude: 126.6227 }, categoryName: "공원", address: "인천 중구", source: "sample" },
  { id: "sinpo-market", name: "신포시장", coordinate: { latitude: 37.4711, longitude: 126.6283 }, categoryName: "전통시장", address: "인천 중구", source: "sample" },
  { id: "dapdong-cathedral", name: "답동성당", coordinate: { latitude: 37.4705, longitude: 126.6287 }, categoryName: "역사 명소", address: "인천 중구", source: "sample" },
];
```

Create three `sampleRoute` segments in that order. Use transit for 수도국산 박물관 → 자유공원 at 8 minutes, downhill walking for 자유공원 → 신포시장 at 14 minutes, and flat walking for 신포시장 → 답동성당 at 5 minutes. Each path contains the two endpoint coordinates and `source: "sample"`.

```ts
// src/features/route/sampleRoute.ts
import { samplePlaces } from "../places/samplePlaces";
import type { RouteSegment } from "./routeTypes";

const [sudoguksan, jayugongwon, sinpoMarket, dapdongCathedral] = samplePlaces;

export const sampleRoute: RouteSegment[] = [
  { id: "segment-1", mode: "transit", fromPlaceId: sudoguksan.id, toPlaceId: jayugongwon.id, minutes: 8, path: [sudoguksan.coordinate, jayugongwon.coordinate], slopeLabel: "unknown", source: "sample" },
  { id: "segment-2", mode: "walk", fromPlaceId: jayugongwon.id, toPlaceId: sinpoMarket.id, minutes: 14, path: [jayugongwon.coordinate, sinpoMarket.coordinate], slopeLabel: "downhill", source: "sample" },
  { id: "segment-3", mode: "walk", fromPlaceId: sinpoMarket.id, toPlaceId: dapdongCathedral.id, minutes: 5, path: [sinpoMarket.coordinate, dapdongCathedral.coordinate], slopeLabel: "flat", source: "sample" },
];
```

Implement `SamplePlaceGateway.search()` as a case-insensitive substring match across `name`, `categoryName`, and `address`. Trim the query; an empty query returns all sample places.

```ts
// src/features/places/samplePlaceGateway.ts
import type { Place, PlaceGateway } from "./placeTypes";
import { samplePlaces } from "./samplePlaces";

export class SamplePlaceGateway implements PlaceGateway {
  async search(keyword: string): Promise<Place[]> {
    const query = keyword.trim().toLocaleLowerCase("ko-KR");
    if (!query) return samplePlaces;
    return samplePlaces.filter((place) =>
      [place.name, place.categoryName, place.address].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(query),
      ),
    );
  }
}
```

- [ ] **Step 5: Implement encoded Kakao links**

```ts
// src/lib/kakaoLinks.ts
import type { Place } from "../features/places/placeTypes";

function placeSegment(place: Place): string {
  const { latitude, longitude } = place.coordinate;
  return `${encodeURIComponent(place.name)},${latitude},${longitude}`;
}

export function createKakaoPlaceLink(place: Place): URL {
  return new URL(`https://map.kakao.com/link/map/${placeSegment(place)}`);
}

export function createKakaoWalkRouteLink(places: Place[]): URL {
  if (places.length < 2 || places.length > 7) {
    throw new RangeError("Kakao walking links require 2 to 7 places");
  }
  return new URL(
    `https://map.kakao.com/link/by/walk/${places.map(placeSegment).join("/")}`,
  );
}
```

- [ ] **Step 6: Verify GREEN and commit**

Run: `npm test`

Expected: all tests pass, including the domain and link tests.

```bash
git add src/features/places src/features/route src/lib
git commit -m "feat: add Dongincheon sample route domain"
```

---

### Task 3: Load Kakao Maps Once and Normalize Place Search

**Files:**
- Create: `src/features/map/kakao/kakaoMaps.types.ts`
- Create: `src/features/map/kakao/loadKakaoMaps.test.ts`
- Create: `src/features/map/kakao/loadKakaoMaps.ts`
- Create: `src/features/map/kakao/kakaoPlaceGateway.test.ts`
- Create: `src/features/map/kakao/kakaoPlaceGateway.ts`

**Interfaces:**
- Consumes: `Place`, `PlaceGateway`, and the public Kakao JavaScript key.
- Produces: `KakaoMapsNamespace`, `loadKakaoMaps(key)`, `resetKakaoMapsLoader()`, `KakaoPlaceGateway`, and `normalizeKakaoPlace(document)`.

- [ ] **Step 1: Write a failing singleton-loader test**

Create a jsdom test that calls `loadKakaoMaps("public-key")` twice before the script resolves, asserts that one `script[data-downhill-kakao-sdk]` exists, installs a fake `window.kakao.maps.load(callback)` implementation, triggers the script `load` event, and asserts both promises resolve to the same namespace. Add a second test that triggers `error`, calls `resetKakaoMapsLoader()`, retries, and confirms a fresh script element is inserted.

The test must name the production behavior: `deduplicates concurrent SDK loads` and `allows an explicit retry after failure`.

```ts
// core of src/features/map/kakao/loadKakaoMaps.test.ts
it("deduplicates concurrent SDK loads", async () => {
  const first = loadKakaoMaps("public-key");
  const second = loadKakaoMaps("public-key");
  const scripts = document.querySelectorAll("script[data-downhill-kakao-sdk]");
  expect(scripts).toHaveLength(1);

  window.kakao = { maps: { load: (callback) => callback() } } as unknown as KakaoMapsNamespace;
  scripts[0].dispatchEvent(new Event("load"));
  await expect(first).resolves.toBe(window.kakao);
  await expect(second).resolves.toBe(window.kakao);
});

it("allows an explicit retry after failure", async () => {
  const failed = loadKakaoMaps("public-key");
  document.querySelector<HTMLScriptElement>("script[data-downhill-kakao-sdk]")!
    .dispatchEvent(new Event("error"));
  await expect(failed).rejects.toThrow("failed to load");

  resetKakaoMapsLoader();
  void loadKakaoMaps("public-key");
  expect(document.querySelectorAll("script[data-downhill-kakao-sdk]")).toHaveLength(1);
});
```

- [ ] **Step 2: Run the loader test and verify RED**

Run: `npm test -- src/features/map/kakao/loadKakaoMaps.test.ts`

Expected: FAIL because `loadKakaoMaps.ts` does not exist.

- [ ] **Step 3: Define only the Kakao SDK types used by this slice**

Define constructor and method types for `maps.load`, `Map`, `LatLng`, `LatLngBounds`, `Marker`, `Polyline`, `services.Places`, and `services.Status`. Define `KakaoPlaceDocument` with `id`, `place_name`, `category_name`, `address_name`, `road_address_name`, `x`, `y`, and `place_url`. Augment `Window` with optional `kakao?: KakaoMapsNamespace`.

Do not copy the full Kakao SDK declaration surface into the repository.

- [ ] **Step 4: Implement the singleton loader**

```ts
// src/features/map/kakao/loadKakaoMaps.ts
import type { KakaoMapsNamespace } from "./kakaoMaps.types";

let sdkPromise: Promise<KakaoMapsNamespace> | undefined;

export function resetKakaoMapsLoader(): void {
  sdkPromise = undefined;
  document.querySelector("script[data-downhill-kakao-sdk]")?.remove();
}

export function loadKakaoMaps(key: string): Promise<KakaoMapsNamespace> {
  if (window.kakao?.maps) return Promise.resolve(window.kakao);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.downhillKakaoSdk = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
    script.async = true;
    script.addEventListener("load", () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK loaded without a maps namespace"));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!));
    });
    script.addEventListener("error", () => {
      reject(new Error("Kakao Maps SDK failed to load"));
    });
    document.head.append(script);
  });

  return sdkPromise;
}
```

- [ ] **Step 5: Write failing place normalization and search tests**

Use an injected fake places service. Assert that a document with `x: "126.6283"` and `y: "37.4711"` becomes a `Place` with longitude `126.6283`, latitude `37.4711`, `source: "kakao"`, and its `place_url`. Assert `ZERO_RESULT` resolves to `[]`. Assert other failure statuses reject with a project-owned `PlaceSearchError` instead of a vendor object.

```ts
// core of src/features/map/kakao/kakaoPlaceGateway.test.ts
it("normalizes Kakao longitude x and latitude y", () => {
  const place = normalizeKakaoPlace({
    id: "123",
    place_name: "신포시장",
    category_name: "시장",
    address_name: "인천 중구",
    road_address_name: "",
    x: "126.6283",
    y: "37.4711",
    place_url: "https://place.map.kakao.com/123",
  });
  expect(place.coordinate).toEqual({ latitude: 37.4711, longitude: 126.6283 });
  expect(place.source).toBe("kakao");
});

it("maps a Kakao zero result to an empty list", async () => {
  const service: KakaoPlacesService = {
    keywordSearch: (_query, callback) => callback([], "ZERO_RESULT"),
  };
  await expect(new KakaoPlaceGateway(service).search("시장")).resolves.toEqual([]);
});
```

- [ ] **Step 6: Run the place adapter test and verify RED**

Run: `npm test -- src/features/map/kakao/kakaoPlaceGateway.test.ts`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 7: Implement the injected Kakao place adapter**

```ts
// src/features/map/kakao/kakaoPlaceGateway.ts
import { PlaceSearchError, type Place, type PlaceGateway } from "../../places/placeTypes";
import type { KakaoPlaceDocument, KakaoPlacesService } from "./kakaoMaps.types";

export function normalizeKakaoPlace(document: KakaoPlaceDocument): Place {
  return {
    id: `kakao-${document.id}`,
    name: document.place_name,
    coordinate: { latitude: Number(document.y), longitude: Number(document.x) },
    categoryName: document.category_name,
    address: document.address_name,
    roadAddress: document.road_address_name || undefined,
    source: "kakao",
    externalUrl: document.place_url,
  };
}

export class KakaoPlaceGateway implements PlaceGateway {
  constructor(private readonly service: KakaoPlacesService) {}

  search(keyword: string): Promise<Place[]> {
    const query = keyword.trim();
    if (!query) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.service.keywordSearch(`동인천 ${query}`, (documents, status) => {
        if (status === "OK") resolve(documents.map(normalizeKakaoPlace));
        else if (status === "ZERO_RESULT") resolve([]);
        else reject(new PlaceSearchError("unknown", "장소 검색을 불러오지 못했어요."));
      });
    });
  }
}
```

- [ ] **Step 8: Verify GREEN and commit**

Run: `npm test`

Expected: all loader and place adapter tests pass with no unhandled promise rejections.

```bash
git add src/features/map/kakao
git commit -m "feat: add Kakao map and place adapters"
```

---

### Task 4: Render a Live Kakao Map with an Accessible Demo Fallback

**Files:**
- Create: `src/features/map/mapTypes.ts`
- Create: `src/features/map/createMapGateway.ts`
- Create: `src/features/map/kakao/kakaoMapGateway.ts`
- Create: `src/features/map/DemoMap.tsx`
- Create: `src/features/map/MapSurface.test.tsx`
- Create: `src/features/map/MapSurface.tsx`

**Interfaces:**
- Consumes: `RuntimeConfig`, `Place[]`, `RouteSegment[]`, and the Kakao loader.
- Produces: `MapSnapshot`, `MapGateway`, `createMapGateway(config)`, and `<MapSurface>`.

- [ ] **Step 1: Write failing lifecycle and fallback tests**

```tsx
// central assertions for src/features/map/MapSurface.test.tsx
it("keeps the sample map usable in demo mode", () => {
  render(
    <MapSurface
      config={{ mapMode: "demo" }}
      places={samplePlaces}
      route={sampleRoute}
      selectedPlaceId="jayugongwon"
    />,
  );
  expect(screen.getByText("예시 데이터")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "동인천 내리막 예시 경로" })).toBeInTheDocument();
});

it("falls back without clearing route content when the live map fails", async () => {
  const createGateway = vi.fn().mockRejectedValue(new Error("sdk failed"));
  render(
    <MapSurface
      config={{ mapMode: "kakao", kakaoJavaScriptKey: "public-key" }}
      places={samplePlaces}
      route={sampleRoute}
      selectedPlaceId="jayugongwon"
      createGateway={createGateway}
    />,
  );
  expect(await screen.findByText("실시간 지도를 불러오지 못했어요.")).toBeInTheDocument();
  expect(screen.getByText("예시 데이터")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "지도 다시 불러오기" })).toBeInTheDocument();
});
```

Add one test with a fake gateway asserting `mount` runs once, `render(snapshot)` receives updated selection, and `destroy` runs on unmount.

- [ ] **Step 2: Run the map component test and verify RED**

Run: `npm test -- src/features/map/MapSurface.test.tsx`

Expected: FAIL because `MapSurface`, `DemoMap`, and the gateway contracts do not exist.

- [ ] **Step 3: Define the gateway contract**

```ts
// src/features/map/mapTypes.ts
import type { Place } from "../places/placeTypes";
import type { RouteSegment } from "../route/routeTypes";

export type MapSnapshot = {
  places: Place[];
  selectedPlaceId?: string;
  route: RouteSegment[];
};

export interface MapGateway {
  mount(container: HTMLElement): void;
  render(snapshot: MapSnapshot): void;
  destroy(): void;
}
```

- [ ] **Step 4: Implement the Kakao map gateway**

`createMapGateway(config)` loads the SDK and returns a `KakaoMapGateway` centered at latitude `37.4738`, longitude `126.6280`, level `5`.

```ts
// src/features/map/createMapGateway.ts
import type { RuntimeConfig } from "../../config/runtimeConfig";
import { loadKakaoMaps } from "./kakao/loadKakaoMaps";
import { KakaoMapGateway } from "./kakao/kakaoMapGateway";
import type { MapGateway } from "./mapTypes";

export async function createMapGateway(config: RuntimeConfig): Promise<MapGateway> {
  if (config.mapMode !== "kakao") {
    throw new Error("A live map gateway requires Kakao configuration");
  }
  const kakao = await loadKakaoMaps(config.kakaoJavaScriptKey);
  return new KakaoMapGateway(kakao, {
    latitude: 37.4738,
    longitude: 126.628,
    level: 5,
  });
}
```

```ts
// route styling exported by src/features/map/kakao/kakaoMapGateway.ts
export const kakaoRouteStyles = {
  transit: { strokeColor: "#174b8c", strokeStyle: "solid" },
  walk: { strokeColor: "#2c7657", strokeStyle: "shortdash" },
  bicycle: { strokeColor: "#e55828", strokeStyle: "dashdot" },
  taxi: { strokeColor: "#6d3fa0", strokeStyle: "solid" },
  pm: { strokeColor: "#087f8c", strokeStyle: "longdash" },
} as const;
```

`KakaoMapGateway` must:

- create one `kakao.maps.Map` in `mount`;
- remove prior markers and polylines before each `render`;
- create markers from normalized `Place.coordinate` values;
- use a visibly different marker image or z-index for `selectedPlaceId`;
- create polylines with mode mappings: transit blue/solid, walk green/short-dash, bicycle orange/dash-dot, taxi purple/solid, PM teal/long-dash;
- extend one `LatLngBounds` with every place and path coordinate, then call `setBounds` when at least two coordinates exist;
- call `setMap(null)` on all overlays and clear arrays in `destroy`.

Keep the mode-to-style mapping as a typed constant so `RouteLegend` can mirror the same labels.

- [ ] **Step 5: Implement the demo map and map state machine**

`DemoMap` renders an SVG with `role="img"` and `aria-label="동인천 내리막 예시 경로"`. It draws three route segments as separate paths with `data-mode`, distinct dash arrays, numbered stops, and a visible “예시 데이터” label. It does not pretend to be a street map.

`MapSurface` behavior:

```ts
type MapSurfaceProps = {
  config: RuntimeConfig;
  places: Place[];
  route: RouteSegment[];
  selectedPlaceId?: string;
  createGateway?: (config: RuntimeConfig) => Promise<MapGateway>;
};
```

For demo mode, render `DemoMap` immediately. For Kakao mode, reserve a `min-height: 360px` map container, announce “동인천 지도를 불러오고 있어요.”, mount the gateway, and pass every prop change to `gateway.render`. On rejection, show the demo map, “실시간 지도를 불러오지 못했어요.”, and “지도 다시 불러오기”. The retry increments a load-attempt state and calls `resetKakaoMapsLoader()` before creating a new gateway.

```tsx
// central lifecycle in src/features/map/MapSurface.tsx
const [attempt, setAttempt] = useState(0);
const [gateway, setGateway] = useState<MapGateway>();
const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

useEffect(() => {
  if (config.mapMode === "demo" || !containerRef.current) return;
  let active = true;
  let mountedGateway: MapGateway | undefined;
  setStatus("loading");
  createGateway(config)
    .then((nextGateway) => {
      if (!active || !containerRef.current) return;
      mountedGateway = nextGateway;
      nextGateway.mount(containerRef.current);
      setGateway(nextGateway);
      setStatus("ready");
    })
    .catch(() => active && setStatus("failed"));
  return () => {
    active = false;
    mountedGateway?.destroy();
  };
}, [attempt, config, createGateway]);

useEffect(() => {
  gateway?.render({ places, selectedPlaceId, route });
}, [gateway, places, route, selectedPlaceId]);
```

- [ ] **Step 6: Verify GREEN and commit**

Run: `npm test && npm run build`

Expected: map lifecycle tests pass and the production bundle compiles without a runtime SDK dependency during build.

```bash
git add src/features/map
git commit -m "feat: add live map with demo fallback"
```

---

### Task 5: Add Search, Empty, Error, Retry, and Selection Behavior

**Files:**
- Create: `src/features/places/PlaceSearchPanel.test.tsx`
- Create: `src/features/places/PlaceSearchPanel.tsx`
- Create: `src/features/places/createPlaceGateway.ts`

**Interfaces:**
- Consumes: `RuntimeConfig`, `PlaceGateway`, `samplePlaces`, `loadKakaoMaps`, and `KakaoPlaceGateway`.
- Produces: `createPlaceGateway(config)` and `<PlaceSearchPanel>` with normalized results and selected IDs.

- [ ] **Step 1: Write failing user-flow tests**

Use `@testing-library/user-event` to cover these named behaviors:

1. `shows curated places before the first search` — renders all four sample places.
2. `submits a trimmed keyword and selects a normalized result` — types ` 시장 `, submits, receives 신포시장, and calls `onTogglePlace("sinpo-market")`.
3. `keeps the newest search result when an older request resolves later` — resolve two deferred promises in reverse order and assert only the second result remains.
4. `keeps recommendations selected and offers retry after search failure` — reject with `PlaceSearchError`, assert the selected card remains pressed, click retry, and assert the same trimmed query is submitted again.
5. `announces an empty result without hiding curated places` — return `[]` and assert “검색 결과가 없어요.” plus the recommendation section.

```tsx
// representative request-order test in PlaceSearchPanel.test.tsx
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

it("keeps the newest search result when an older request resolves later", async () => {
  const first = deferred<Place[]>();
  const second = deferred<Place[]>();
  const gateway = { search: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) };
  const onResultsChange = vi.fn();
  render(
    <PlaceSearchPanel
      gateway={gateway}
      recommendations={samplePlaces}
      selectedPlaceIds={[]}
      onTogglePlace={vi.fn()}
      onResultsChange={onResultsChange}
    />,
  );

  const input = screen.getByRole("searchbox", { name: "동인천에서 장소 찾기" });
  await userEvent.type(input, "공원");
  await userEvent.click(screen.getByRole("button", { name: "장소 찾기" }));
  await userEvent.clear(input);
  await userEvent.type(input, "시장");
  await userEvent.click(screen.getByRole("button", { name: "장소 찾기" }));

  second.resolve([samplePlaces[2]]);
  await screen.findAllByText("신포시장");
  first.resolve([samplePlaces[1]]);
  await waitFor(() => expect(onResultsChange).toHaveBeenLastCalledWith([samplePlaces[2]]));
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/features/places/PlaceSearchPanel.test.tsx`

Expected: FAIL because `PlaceSearchPanel.tsx` does not exist.

- [ ] **Step 3: Implement place gateway selection**

```ts
// src/features/places/createPlaceGateway.ts
import type { RuntimeConfig } from "../../config/runtimeConfig";
import { loadKakaoMaps } from "../map/kakao/loadKakaoMaps";
import { KakaoPlaceGateway } from "../map/kakao/kakaoPlaceGateway";
import type { PlaceGateway } from "./placeTypes";
import { SamplePlaceGateway } from "./samplePlaceGateway";

export async function createPlaceGateway(config: RuntimeConfig): Promise<PlaceGateway> {
  if (config.mapMode === "demo") return new SamplePlaceGateway();
  const kakao = await loadKakaoMaps(config.kakaoJavaScriptKey);
  return new KakaoPlaceGateway(new kakao.maps.services.Places());
}
```

- [ ] **Step 4: Implement the place-search state machine**

`PlaceSearchPanel` receives:

```ts
type PlaceSearchPanelProps = {
  gateway: PlaceGateway;
  recommendations: Place[];
  selectedPlaceIds: string[];
  onTogglePlace(place: Place): void;
  onResultsChange(places: Place[]): void;
};
```

Use an explicit form submission rather than search-on-every-keystroke. Keep `query`, `submittedQuery`, `results`, `status`, and `requestSequence` state. Before a request, increment the sequence; apply results only if the finishing request owns the current sequence. Preserve `selectedPlaceIds` across loading, empty, and error states.

Call `onResultsChange` only for the newest successful request. Pass `[]` for an empty newest result, but do not clear prior results on a loading or error transition.

Every place card is a `<button type="button" aria-pressed={selected}>` showing place name, category, address, and “실시간 장소” or “예시 장소”. The search submit button says “장소 찾기”. The retry button says “같은 검색 다시 시도”. The results container uses `aria-live="polite"` only for loading, result count, empty, and error status text.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test`

Expected: all five place-search flows pass without stale result leakage.

```bash
git add src/features/places
git commit -m "feat: add resilient Dongincheon place search"
```

---

### Task 6: Compose the Complete Mobile Route Screen

**Files:**
- Create: `src/features/route/RouteLegend.tsx`
- Create: `src/features/route/RouteSummary.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: runtime config, place and map gateway factories, sample places, sample route, map surface, and Kakao deep links.
- Produces: the complete “내리막 승차권” mobile screen and an end-to-end demo-mode component test.

- [ ] **Step 1: Replace the shell test with failing complete-flow assertions**

In `App.test.tsx`, render `App` in demo mode through a `config` prop and assert:

```tsx
expect(screen.getByText("추천 코스 · 예시 데이터")).toBeInTheDocument();
expect(screen.getByText("오르막 82% 덜 걷기")).toBeInTheDocument();
expect(screen.getByText("예상 비용 ₩1,500")).toBeInTheDocument();
expect(screen.getByText("4곳 · 1시간 45분")).toBeInTheDocument();
expect(screen.getByRole("img", { name: "동인천 내리막 예시 경로" })).toBeInTheDocument();
expect(screen.getByRole("list", { name: "구간별 이동 안내" })).toBeInTheDocument();
expect(screen.getByText("버스 · 실선")).toBeInTheDocument();
expect(screen.getByText("도보 · 짧은 점선")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Kakao Map에서 도보 경로 열기" })).toHaveAttribute(
  "href",
  expect.stringContaining("https://map.kakao.com/link/by/walk/"),
);
```

Add a test that selects 자유공원 and asserts its place button becomes pressed and the map surface receives `selectedPlaceId="jayugongwon"` through a visible selected summary.

- [ ] **Step 2: Run the app test and verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because the complete route UI and legend do not exist.

- [ ] **Step 3: Implement the route legend and ordered summary**

`RouteLegend` renders list items for every mode used by `sampleRoute`. Each item combines a Korean label, an inline line swatch with a mode-specific border style, and text such as `버스 · 실선` or `도보 · 짧은 점선`.

`RouteSummary` receives `places` and `route`, resolves every segment's place names, and renders an ordered list labeled `구간별 이동 안내`. Each item contains sequence number, destination, transport label, minutes, and slope label. Add a visible `예시 경로` badge to every sample segment group.

```ts
// shared labels in src/features/route/RouteLegend.tsx
const modeLabels = {
  transit: { label: "버스", pattern: "실선" },
  walk: { label: "도보", pattern: "짧은 점선" },
  bicycle: { label: "자전거", pattern: "점·선" },
  taxi: { label: "택시", pattern: "굵은 실선" },
  pm: { label: "PM", pattern: "긴 점선" },
} as const;
```

```tsx
// ordered route item shape in src/features/route/RouteSummary.tsx
<li key={segment.id} className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-ink/15 py-4">
  <span aria-hidden="true">{index + 1}</span>
  <span>
    <strong className="block">{destination.name}</strong>
    <span>{modeLabels[segment.mode].label} · {segment.minutes}분</span>
  </span>
  <span>예시 경로</span>
</li>
```

- [ ] **Step 4: Compose the app with dependency injection for tests**

```ts
type AppProps = {
  config?: RuntimeConfig;
  placeGatewayFactory?: (config: RuntimeConfig) => Promise<PlaceGateway>;
  mapGatewayFactory?: (config: RuntimeConfig) => Promise<MapGateway>;
};
```

When no prop is supplied, resolve `import.meta.env`. Initialize the place gateway in an effect; while it loads, keep the curated sample cards interactive. If live gateway creation fails, use `SamplePlaceGateway` and show “실시간 장소 검색을 사용할 수 없어 예시 장소를 보여 드려요.”

Store the newest live search results in `App`. Merge them with `samplePlaces` by `id`, then pass the merged array to `MapSurface`; this makes a selected live result appear as a marker without leaking Kakao SDK documents into React state. When a place is selected, show a text summary and an explicit `createKakaoPlaceLink(selectedPlace)` action next to the course-level walking link.

Lay out these sections in order:

1. product label and headline;
2. three example metric cells;
3. selected-place count and `PlaceSearchPanel`;
4. `MapSurface` with map status above it;
5. `RouteLegend`;
6. `RouteSummary`;
7. explicit external Kakao Map link with `target="_blank"` and `rel="noreferrer"`.

On wider screens, place search and map use a two-column layout. On phones, use one column and keep the primary external-map action reachable below the route summary. Apply the paper, blue, green, and orange tokens from `index.css`; reserve orange for actionable controls.

- [ ] **Step 5: Verify GREEN, accessibility semantics, and build**

Run:

```bash
npm test
npm run build
```

Expected: all unit and component tests pass. The production build has no TypeScript errors. No test searches for styling classes as a proxy for behavior.

- [ ] **Step 6: Commit the complete screen**

```bash
git add src/app src/features/route src/index.css
git commit -m "feat: compose Downhill Route map experience"
```

---

### Task 7: Document Configuration and Publish Without Localhost

**Files:**
- Modify: `.env.example`
- Create: `README.md`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: the build and test scripts, GitHub repository `jej2660/AgentTrip`, and optional Actions secret `VITE_KAKAO_MAP_JAVASCRIPT_KEY`.
- Produces: a tested `dist/` artifact and a GitHub Pages deployment at `https://jej2660.github.io/AgentTrip/` after the workflow is enabled and pushed.

- [ ] **Step 1: Add the public Kakao variable to the example environment**

Append without changing existing Runyour variables:

```dotenv
# Public Kakao Maps JavaScript key. Restrict it to the exact deployed domains.
VITE_KAKAO_MAP_JAVASCRIPT_KEY=
```

- [ ] **Step 2: Document local and remote setup**

Create `README.md` with these exact sections:

- product summary and the “예시 데이터” rule;
- prerequisites: Node.js 22.12+ and npm;
- `npm install`, `npm test`, `npm run dev`, and `npm run build` commands;
- Kakao Developers steps: create/select an app, obtain the JavaScript key, register `http://localhost:5173` only for local development, and register `https://jej2660.github.io` for Pages;
- local `.env` setup for `VITE_KAKAO_MAP_JAVASCRIPT_KEY`;
- GitHub Actions secret setup using the same variable name;
- demo-mode behavior when the variable is empty;
- an explicit warning that Kakao REST and TMAP secrets must never receive the `VITE_` prefix;
- the published URL `https://jej2660.github.io/AgentTrip/`.

- [ ] **Step 3: Add the GitHub Pages workflow**

```yaml
# .github/workflows/deploy-pages.yml
name: Deploy Downhill Route to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
        env:
          VITE_KAKAO_MAP_JAVASCRIPT_KEY: ${{ secrets.VITE_KAKAO_MAP_JAVASCRIPT_KEY }}
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: Verify the Pages base path before committing**

Run:

```bash
GITHUB_ACTIONS=true npm run build
rg 'src="/AgentTrip/|href="/AgentTrip/' dist/index.html
```

Expected: the build succeeds and `dist/index.html` references assets beneath `/AgentTrip/`.

- [ ] **Step 5: Run the full local quality gate**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: all tests pass, the build succeeds, `git diff --check` prints nothing, and only intended project files are modified or untracked.

- [ ] **Step 6: Commit deployment and documentation**

```bash
git add .env.example README.md .github/workflows/deploy-pages.yml vite.config.ts
git commit -m "ci: publish Downhill Route to GitHub Pages"
```

- [ ] **Step 7: Push and verify the remote deployment**

Run:

```bash
git push origin main
gh run list --workflow deploy-pages.yml --limit 1
```

Wait for the workflow to finish, then open `https://jej2660.github.io/AgentTrip/`. Verify the headline, four sample places, route legend, ordered route list, demo label when no key exists, and live Kakao map when the Actions secret and registered domain exist.

If GitHub reports that Pages is not enabled, enable GitHub Actions as the Pages publishing source for `jej2660/AgentTrip`, rerun the workflow, and repeat the same remote checks. Do not report a public URL until it returns the built application.

---

## Final Verification

After all seven tasks:

```bash
npm test
npm run build
git diff --check
git status --short
git log --oneline --max-count=10
```

Confirm that every test passes, the production build succeeds, the worktree is clean, and the seven implementation commits appear after design commit `2c41a43`. Confirm separately that the GitHub Pages workflow succeeded and the public URL serves the current commit.
