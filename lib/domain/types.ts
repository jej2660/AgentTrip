export type Mode = 'walk' | 'taxi' | 'bus' | 'pm';   // 'car'는 베이스캠프 이동(루프 밖)에만 등장
export type PersonaId = 'gold_toad' | 'toad' | 'turtle' | 'rabbit' | 'sloth';
export type Weather = 'clear' | 'rain' | 'heat' | 'cold';
export type PoiCategory =
  | 'station' | 'park' | 'viewpoint' | 'market' | 'heritage'
  | 'museum' | 'cafe' | 'food' | 'parking' | 'rest';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Poi {
  id: string;                 // e.g. 'dongincheon:jayu-park'
  regionId: string;           // e.g. 'dongincheon'
  name: string;
  location: LatLng;
  elevationM: number;         // 사전 계산값
  category: PoiCategory;
  themes: string[];           // '근대개항장' | '시장·먹거리' | '전망·공원' | '카페·휴식'
  indoor: boolean;            // 우천·폭염 대체 스팟 후보
  covered: boolean;           // 아케이드 시장 등 지붕 있는 공간
  stayMin: number;            // 기본 체류 시간
  priority: 1 | 2 | 3;        // 1=핵심
  transitAccess: boolean;     // 마을버스 승하차 가능 여부
  vehicleDropOff?: LatLng;    // 차량 하차 지점
  description?: string;       // 에이전트에겐 untrusted data
}

export interface RouteRequest {
  regionId: string;
  start: { poiId: string } | LatLng;
  poiIds: string[];           // 1..8
  persona: PersonaId;
  allowedModes: Mode[];       // 'walk' 필수 포함
  car: { enabled: false } | { enabled: true; parkingId: string | 'auto' };
  avoidStairs: boolean;
  weather: Weather;
  note?: string;              // ≤ 200자
}

export interface Leg {
  from: { poiId: string; name: string; location: LatLng; elevationM: number; transitAccess?: boolean };
  to:   { poiId: string; name: string; location: LatLng; elevationM: number; transitAccess?: boolean };
  mode: Mode;
  distanceM: number;
  durationMin: number;
  ascentM: number;
  descentM: number;
  walkDistanceM: number;
  effortFlatM: number;
  costKrw: number;
  geometry: Array<[lng: number, lat: number, eleM: number]>;
  maxUpGradePct: number;
  maxDownGradePct: number;
  hasStairs: boolean;
  estimated: boolean;
  label: string;              // e.g. "택시 4분 · 오르막 탑승 · 4,200원"
  tip?: string;
  notes: string[];
}

export interface Metrics {
  walkDistanceM: number;
  uphillWalkM: number;
  ascentWalkM: number;
  effortFlatM: number;
  steps: number;
  moveMin: number;
  totalMin: number;
  costKrw: number;
}

export interface Savings {
  uphillWalkReductionPct: number;   // 0..100
  effortSavedKm: number;            // (baseline - optimized) / 1000
  extraCostKrw: number;
  extraTimeMin: number;
}

export interface InvariantReport {
  ok: boolean;
  violations: Array<{ code: string; legIndex?: number; message: string }>;
}

export interface RoutePlan {
  order: string[];                  // start/end 포함 방문 순서 poiId
  legs: Leg[];
  skipped: Array<{ poiId: string; reason: string }>;
  strategy: 'linear' | 'loop_bottom_up' | 'loop_top_down';
  parkingRecommendation?: { poiId: string; reason: string };
  totals: Metrics;
  baseline: Metrics;
  savings: Savings;
  profile: Array<{ distM: number; eleM: number; mode: Mode; poiId?: string }>;
  invariants: InvariantReport;
  explanation?: string;
  generatedBy: 'agent' | 'engine';
  warnings: string[];
}

export type PlanStatus = 'queued' | 'running' | 'done' | 'failed';

export interface PlanJob {
  id: string;                       // 공유 링크 키
  status: PlanStatus;
  request: RouteRequest;
  progress: Array<{ at: number; stage: string; message: string }>;
  plan?: RoutePlan;
  error?: { code: string; message: string };
  run?: { runId: string; steps: number; durationMs: number; fallback?: string };
  createdAt: number;
  expiresAt: number;
}
