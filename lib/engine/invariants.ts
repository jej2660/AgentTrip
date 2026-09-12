import { InvariantReport, Leg, PersonaId, Weather } from '../domain/types';
import { PERSONAS } from './personas';

export function isSignificantUphill(leg: Leg): boolean {
  if (leg.ascentM >= 10) return true;
  if (leg.distanceM > 0 && leg.maxUpGradePct >= 5 && leg.distanceM >= 200) return true;
  return false;
}

export function checkInvariants(
  legs: Leg[],
  persona: PersonaId,
  weather: Weather,
  avoidStairs: boolean,
  allowedModes: string[]
): InvariantReport {
  const violations: Array<{ code: string; legIndex?: number; message: string }> = [];
  const pConfig = PERSONAS[persona];

  legs.forEach((leg, i) => {
    const isUphill = isSignificantUphill(leg);

    // 1. UPHILL_WALK
    if (leg.mode === 'walk' && isUphill) {
      if (persona === 'gold_toad' || persona === 'toad' || persona === 'turtle' || persona === 'sloth') {
        violations.push({
          code: 'UPHILL_WALK',
          legIndex: i,
          message: `${pConfig.name} 페르소나는 오르막 구간 도보 이동이 금지됩니다.`,
        });
      } else if (persona === 'rabbit' && leg.ascentM > 40) {
        violations.push({
          code: 'UPHILL_WALK_RABBIT_EXCEEDED',
          legIndex: i,
          message: `토끼 페르소나는 구간 상승 40m 초과 도보 이동이 금지됩니다.`,
        });
      }
    }

    // 2. WALK_TOO_LONG
    if (leg.mode === 'walk' && leg.walkDistanceM > pConfig.maxWalkLegM) {
      violations.push({
        code: 'WALK_TOO_LONG',
        legIndex: i,
        message: `도보 거리(${leg.walkDistanceM}m)가 페르소나 상한(${pConfig.maxWalkLegM}m)을 초과했습니다.`,
      });
    }

    // 3. STAIRS
    if (leg.mode === 'walk' && leg.hasStairs && (persona === 'toad' || avoidStairs)) {
      violations.push({
        code: 'STAIRS',
        legIndex: i,
        message: `계단 도보 이용이 허용되지 않습니다.`,
      });
    }

    // 4. TURTLE_TAXI
    if (persona === 'turtle' && leg.mode === 'taxi') {
      // Check if bus was possible for this leg
      if (leg.from.transitAccess && leg.to.transitAccess) {
        violations.push({
          code: 'TURTLE_TAXI',
          legIndex: i,
          message: `거북이 페르소나는 버스 이용 가능한 구간에서 택시를 탈 수 없습니다.`,
        });
      }
    }

    // 5. PM_RAIN
    if (leg.mode === 'pm' && weather === 'rain') {
      violations.push({
        code: 'PM_RAIN',
        legIndex: i,
        message: `우천 시 PM(공유 킥보드/자전거) 이용이 전역 금지됩니다.`,
      });
    }

    // 6. MODE_NOT_ALLOWED
    if (!allowedModes.includes(leg.mode)) {
      violations.push({
        code: 'MODE_NOT_ALLOWED',
        legIndex: i,
        message: `허용되지 않은 이동수단(${leg.mode})이 선택되었습니다.`,
      });
    }
  });

  return {
    ok: violations.length === 0,
    violations,
  };
}
