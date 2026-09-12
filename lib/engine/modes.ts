import { ENGINE_CONFIG } from './config';
import { Mode, PersonaId, Weather, LatLng } from '../domain/types';
import { calculateWalkEffortFlatM, calculateWalkDurationMin } from './effort';

export interface LegModeInput {
  from: { location: LatLng; elevationM: number; transitAccess: boolean };
  to: { location: LatLng; elevationM: number; transitAccess: boolean; vehicleDropOff?: LatLng };
  distanceM: number; // Straight or driving distance
  hasStairs: boolean;
  covered: boolean;
  weather: Weather;
  avoidStairs: boolean;
  walkingReference?: boolean;
}

export interface ModeCalculationResult {
  mode: Mode;
  costKrw: number;
  durationMin: number;
  walkDistanceM: number;
  effortFlatM: number;
  ascentM: number;
  descentM: number;
  maxUpGradePct: number;
  maxDownGradePct: number;
  isAllowed: boolean;
  violationReason?: string;
}

export function getHaversineDistanceM(from: LatLng, to: LatLng): number {
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateModeCost(
  mode: Mode,
  input: LegModeInput,
  persona: PersonaId
): ModeCalculationResult {
  const dh = input.to.elevationM - input.from.elevationM;
  const ascentM = Math.max(0, dh);
  const descentM = Math.max(0, -dh);
  const gradePct = input.distanceM > 0 ? (dh / input.distanceM) * 100 : 0;

  let maxUpGradePct = gradePct > 0 ? gradePct : 0;
  let maxDownGradePct = gradePct < 0 ? Math.abs(gradePct) : 0;

  if (mode === 'walk') {
    const walkDistanceM = input.distanceM;
    const effortFlatM = calculateWalkEffortFlatM(
      {
        distanceM: walkDistanceM,
        elevationDiffM: dh,
        hasStairs: input.hasStairs,
        covered: input.covered,
      },
      persona,
      input.weather
    );
    const durationMin = calculateWalkDurationMin(walkDistanceM, dh);

    // Persona invariant check for walk
    if (!input.walkingReference && (persona === 'rabbit' ? ascentM > 40 : ascentM >= 10)) {
      return {
        mode: 'walk', costKrw: 0, durationMin: 0, walkDistanceM, effortFlatM, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'UPHILL_WALK_FORBIDDEN'
      };
    }

    return {
      mode: 'walk', costKrw: 0, durationMin, walkDistanceM, effortFlatM, ascentM, descentM, maxUpGradePct, maxDownGradePct, isAllowed: true
    };
  }

  if (mode === 'taxi') {
    if (input.distanceM < ENGINE_CONFIG.TAXI_MIN_LEG_M) {
      return {
        mode: 'taxi', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'TAXI_TOO_SHORT'
      };
    }

    // Turtle persona cannot use taxi if transit access is available at both ends
    if (persona === 'turtle' && input.from.transitAccess && input.to.transitAccess) {
      return {
        mode: 'taxi', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'TURTLE_TAXI_FORBIDDEN_TRANSIT_AVAILABLE'
      };
    }

    const driveDistM = input.distanceM;
    const driveDurationMin = ENGINE_CONFIG.TAXI_WAIT_MIN + (driveDistM / 1000 / ENGINE_CONFIG.TAXI_SPEED_KMH) * 60;

    let costKrw = ENGINE_CONFIG.TAXI_BASE_FARE_KRW;
    if (driveDistM > ENGINE_CONFIG.TAXI_BASE_DIST_M) {
      const extraDistM = driveDistM - ENGINE_CONFIG.TAXI_BASE_DIST_M;
      costKrw += Math.ceil(extraDistM / ENGINE_CONFIG.TAXI_PER_DIST_M) * ENGINE_CONFIG.TAXI_PER_FARE_KRW;
    }

    const walkDistanceM = input.to.vehicleDropOff
      ? ENGINE_CONFIG.TAXI_ACCESS_WALK_M
      : ENGINE_CONFIG.TAXI_ACCESS_WALK_M * 2;
    const effortFlatM = walkDistanceM;

    return {
      mode: 'taxi', costKrw, durationMin: driveDurationMin, walkDistanceM, effortFlatM, ascentM, descentM, maxUpGradePct, maxDownGradePct, isAllowed: true
    };
  }

  if (mode === 'bus') {
    if (!input.from.transitAccess || !input.to.transitAccess) {
      return {
        mode: 'bus', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'BUS_NO_TRANSIT_ACCESS'
      };
    }

    const durationMin =
      ENGINE_CONFIG.BUS_ACCESS_MIN +
      ENGINE_CONFIG.BUS_WAIT_MIN +
      (input.distanceM / 1000 / ENGINE_CONFIG.BUS_SPEED_KMH) * 60;
    const walkDistanceM = ENGINE_CONFIG.BUS_ACCESS_WALK_M;
    const effortFlatM = walkDistanceM;

    return {
      mode: 'bus', costKrw: ENGINE_CONFIG.BUS_FARE_KRW, durationMin, walkDistanceM, effortFlatM, ascentM, descentM, maxUpGradePct, maxDownGradePct, isAllowed: true
    };
  }

  if (mode === 'pm') {
    if (input.weather === 'rain') {
      return {
        mode: 'pm', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'PM_RAIN'
      };
    }

    if (gradePct > ENGINE_CONFIG.PM_MAX_UP_GRADE_PCT || gradePct < -ENGINE_CONFIG.PM_MAX_DOWN_GRADE_PCT) {
      return {
        mode: 'pm', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
        isAllowed: false, violationReason: 'PM_GRADE_EXCEEDED'
      };
    }

    const driveMin = (input.distanceM / 1000 / ENGINE_CONFIG.PM_SPEED_KMH) * 60;
    const durationMin = ENGINE_CONFIG.PM_UNLOCK_MIN + driveMin;
    const costKrw = ENGINE_CONFIG.PM_UNLOCK_KRW + Math.ceil(driveMin) * ENGINE_CONFIG.PM_PER_MIN_KRW;
    const walkDistanceM = ENGINE_CONFIG.PM_ACCESS_WALK_M * 2;
    const effortFlatM = walkDistanceM + input.distanceM * ENGINE_CONFIG.PM_EFFORT_FACTOR;

    return {
      mode: 'pm', costKrw, durationMin, walkDistanceM, effortFlatM, ascentM, descentM, maxUpGradePct, maxDownGradePct, isAllowed: true
    };
  }

  return {
    mode: 'walk', costKrw: 0, durationMin: 0, walkDistanceM: 0, effortFlatM: 0, ascentM, descentM, maxUpGradePct, maxDownGradePct,
    isAllowed: false, violationReason: 'UNKNOWN_MODE'
  };
}
