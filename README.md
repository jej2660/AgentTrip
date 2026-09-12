# Downhill Route

동인천에서 오르막 도보를 줄이는 여행 코스 실험입니다. AgentTrip의 화면 기획과 OpenClaw의 Next.js 엔진을 이 저장소로 통합했습니다. 원본 OpenClaw 작업 공간은 수정하지 않았습니다.

## 실행

Node.js 22.12 이상에서 `npm ci` 후 `npm run dev`를 실행하고 http://localhost:3000 에 접속합니다. 지도 표시와 추정 코스 생성에는 API 키가 필요하지 않습니다.

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`로 검증합니다. 브라우저 테스트는 최초 `npx playwright install chromium` 후 `npm run test:e2e`로 실행합니다.

## 통합 범위

- `/plan`: 장소, 이동 성향, 교통수단, 날씨, 주차장 복귀 조건 선택
- `/api/route/engine`: 기존 결정론 엔진으로 동선 계산
- `/result/[planId]`: 지도, 고도 그래프, 이동 구간과 예상 비용 표시
- 결과는 현재 탭의 sessionStorage에 보관됩니다. 새로고침은 가능하지만 다른 기기로 공유하거나 탭을 닫은 뒤 복원하는 기능은 없습니다.

## 지도와 데이터의 한계

지도 배경은 Leaflet + OpenStreetMap입니다. [Leaflet 안내](https://leafletjs.com/examples/quick-start/)와 [OSM 타일 이용 정책](https://operations.osmfoundation.org/policies/tiles/)에 따라 출처를 표시하고, 브라우저의 기본 캐시를 사용하며, 오프라인 다운로드나 타일 미리받기는 하지 않습니다. 대규모 배포 전에는 사용량에 맞는 타일 공급자를 선정해야 합니다.

현재 경로는 POI 좌표·고도의 근사 계산입니다. 점선은 실제 도로를 따라가는 길안내가 아니며 요금, 버스 연결, 계단 유무, 고도는 현장 검증이 필요합니다. 특히 계단 회피 선택은 접근 가능한 길을 보증하지 않습니다. ORS 공급자 코드는 가져왔지만 기본 엔진에는 연결하지 않았습니다. 날씨는 수동 설정이며 실시간 날씨 API가 아닙니다.

기존 Vite/GitHub Pages 설계 문서는 이 통합으로 대체되었습니다. API가 포함된 Next.js 프로젝트이므로 정적 GitHub Pages 대신 Node.js 런타임 또는 Next.js 지원 호스팅이 필요합니다. 이 작업에서 공개 배포를 자동으로 생성하지는 않습니다.

가져온 파일과 원본 버전은 `docs/integration-source.json`에 기록했습니다. 해시는 가져오기 당시의 스냅샷이며 이후 통합 수정 내용은 Git 이력에 남습니다.
