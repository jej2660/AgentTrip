import { Poi, Mode, PersonaId, Weather, RoutePlan } from '../domain/types';
import { RouteProvider } from '../providers/RouteProvider';
import { solveRouteOrder } from './solver';
import { NoFeasibleRouteError } from './errors';

export interface BasecampResult {
  parkingPoi: Poi;
  strategy: 'loop_bottom_up' | 'loop_top_down';
  reason: string;
}

export async function selectBasecampParking(
  parkingPois: Poi[],
  targetPois: Poi[],
  allowedModes: Mode[],
  persona: PersonaId,
  weather: Weather,
  avoidStairs: boolean,
  provider: RouteProvider
): Promise<BasecampResult> {
  if (parkingPois.length === 0) {
    throw new Error('No parking POIs available for basecamp selection');
  }

  let bestParking = parkingPois[0];
  let minEffort = Infinity;
  let bestFirstLegMode: Mode = 'walk';

  for (const parking of parkingPois) {
    const candidates = await solveRouteOrder(
      parking,
      parking, // end = start (loop)
      targetPois.filter(p => p.id !== parking.id),
      allowedModes,
      persona,
      weather,
      avoidStairs,
      provider,
      1
    );

    if (candidates.length > 0 && candidates[0].totalEffortFlatM < minEffort) {
      minEffort = candidates[0].totalEffortFlatM;
      bestParking = parking;
      if (candidates[0].legs.length > 0) {
        bestFirstLegMode = candidates[0].legs[0].mode;
      }
    }
  }
  if (!Number.isFinite(minEffort)) throw new NoFeasibleRouteError('조건을 만족하는 주차장 순환 경로가 없습니다.');

  // Strategy label determination
  const targetElevations = targetPois.map((p) => p.elevationM).sort((a, b) => a - b);
  const p30Index = Math.floor(targetElevations.length * 0.3);
  const p30Elevation = targetElevations[p30Index] || targetElevations[0];
  const maxTargetElevation = targetElevations[targetElevations.length - 1];

  let strategy: 'loop_bottom_up' | 'loop_top_down' = 'loop_bottom_up';
  let reason = '';

  if (bestParking.elevationM >= maxTargetElevation) {
    strategy = 'loop_top_down';
    reason = `주차장(${bestParking.name}, 고도 ${bestParking.elevationM}m)이 주요 방문지 중 최고점에 위치하여 내리막 순환 코스를 형성합니다.`;
  } else if (bestParking.elevationM <= p30Elevation && (bestFirstLegMode === 'taxi' || bestFirstLegMode === 'bus')) {
    strategy = 'loop_bottom_up';
    reason = `하부 주차장(${bestParking.name}, 고도 ${bestParking.elevationM}m)에 주차 후 첫 구간을 ${bestFirstLegMode === 'taxi' ? '택시' : '버스'}로 최고점까지 이동한 뒤 내리막으로 복귀합니다.`;
  } else {
    strategy = 'loop_bottom_up';
    reason = `전체 순환 동선의 체력 소모를 최소화하는 베이스캠프로 ${bestParking.name}(고도 ${bestParking.elevationM}m)을 추천합니다.`;
  }

  return {
    parkingPoi: bestParking,
    strategy,
    reason,
  };
}
