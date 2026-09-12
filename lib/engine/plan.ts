import { RouteRequest, RoutePlan, Poi } from '../domain/types';
import { RouteProvider } from '../providers/RouteProvider';
import { ApproxRouteProvider } from '../providers/approx';
import { solveRouteOrder } from './solver';
import { selectBasecampParking } from './basecamp';
import { applySlothSkip } from './sloth';
import { calculateMetrics, calculateSavings } from './report';
import { generateElevationProfile } from './profile';
import { checkInvariants } from './invariants';
import seedPois from '../data/regions/dongincheon/pois.json';
import seedParkings from '../data/regions/dongincheon/parkings.json';
import { InvalidRouteRequestError, NoFeasibleRouteError } from './errors';

export async function generateEnginePlan(
  request: RouteRequest,
  providerOverride?: RouteProvider
): Promise<RoutePlan> {
  const provider = providerOverride || new ApproxRouteProvider();
  if (request.regionId !== 'dongincheon') throw new InvalidRouteRequestError('Unknown region');
  const allSeedPois = [...(seedPois as Poi[]), ...(seedParkings as Poi[])];

  // Resolve start POI
  let startPoi: Poi;
  if ('poiId' in request.start) {
    const startId = request.start.poiId;
    const found = allSeedPois.find((p) => p.id === startId);
    if (!found) {
      throw new InvalidRouteRequestError(`Start POI ${startId} not found`);
    }
    startPoi = found;
  } else {
    // Custom LatLng start
    startPoi = {
      id: 'custom:start',
      regionId: request.regionId,
      name: '출발지',
      location: request.start,
      elevationM: 10, // Default baseline elevation for custom start
      category: 'station',
      themes: [],
      indoor: false,
      covered: false,
      stayMin: 0,
      priority: 1,
      transitAccess: true,
    };
  }

  // Resolve requested target POIs
  let targetPois = request.poiIds.map((id) => {
    const found = allSeedPois.find((p) => p.id === id);
    if (!found) {
      throw new InvalidRouteRequestError(`Target POI ${id} not found`);
    }
    return found;
  });

  let endPoi: Poi | null = null;
  let strategy: 'linear' | 'loop_bottom_up' | 'loop_top_down' = 'linear';
  let parkingRecommendation: { poiId: string; reason: string } | undefined;

  // Handle car / basecamp parking logic
  if (request.car.enabled) {
    let parkingPoi: Poi;
    const parkingCandidates = seedParkings as Poi[];

    if (request.car.parkingId === 'auto') {
      const basecampResult = await selectBasecampParking(
        parkingCandidates,
        targetPois,
        request.allowedModes,
        request.persona,
        request.weather,
        request.avoidStairs,
        provider
      );
      parkingPoi = basecampResult.parkingPoi;
      strategy = basecampResult.strategy;
      parkingRecommendation = {
        poiId: parkingPoi.id,
        reason: basecampResult.reason,
      };
    } else {
      const parkingId = request.car.parkingId;
      const found = parkingCandidates.find((p) => p.id === parkingId);
      if (!found) {
        throw new InvalidRouteRequestError(`Parking POI ${parkingId} not found`);
      }
      parkingPoi = found;
      strategy = 'loop_bottom_up';
    }

    startPoi = parkingPoi;
    endPoi = parkingPoi;
  }
  targetPois = targetPois.filter(p => p.id !== startPoi.id && p.id !== endPoi?.id);

  // Handle Sloth persona skip logic
  let skipped: Array<{ poiId: string; reason: string }> = [];
  if (request.persona === 'sloth') {
    const slothResult = applySlothSkip(targetPois, 1500, (pois) => {
      // Rough effort estimation callback
      return pois.reduce((acc, p) => acc + p.elevationM * 8 + 300, 0);
    });
    targetPois = slothResult.keptPois;
    skipped = slothResult.skipped;
  }

  // Execute solver
  const solverCandidates = await solveRouteOrder(
    startPoi,
    endPoi,
    targetPois,
    request.allowedModes,
    request.persona,
    request.weather,
    request.avoidStairs,
    provider,
    1
  );

  if (solverCandidates.length === 0) {
    throw new NoFeasibleRouteError('선택한 이동수단과 조건으로 방문지를 연결할 수 없습니다.');
  }

  const bestCandidate = solverCandidates[0];
  const totalStayMin = targetPois.reduce((sum, p) => sum + p.stayMin, 0);

  // Calculate optimized totals
  const totals = calculateMetrics(bestCandidate.legs, totalStayMin);

  // Calculate baseline (shortest walking-only route in same start)
  const baselineCandidates = await solveRouteOrder(
    startPoi,
    endPoi,
    targetPois,
    ['walk'], // Walk only
    request.persona,
    request.weather,
    false,
    provider,
    1,
    true // Distance objective, unrestricted walking reference with the same effort formula
  );

  if (!baselineCandidates.length) throw new NoFeasibleRouteError('도보 비교 경로를 계산할 수 없습니다.');
  const baselineLegs = baselineCandidates[0].legs;
  const baseline = calculateMetrics(baselineLegs, totalStayMin);

  const savings = calculateSavings(totals, baseline);
  const profile = generateElevationProfile(bestCandidate.legs);
  const invariants = checkInvariants(
    bestCandidate.legs,
    request.persona,
    request.weather,
    request.avoidStairs,
    request.allowedModes
  );

  const warnings: string[] = [];
  if (bestCandidate.legs.some((l) => l.estimated)) {
    warnings.push('실경로 API 공급자 연결 전 상태로 추정 경로로 계산되었습니다.');
  }

  return {
    order: bestCandidate.order,
    legs: bestCandidate.legs,
    skipped,
    strategy,
    parkingRecommendation,
    totals,
    baseline,
    savings,
    profile,
    invariants,
    generatedBy: 'engine',
    warnings,
  };
}
