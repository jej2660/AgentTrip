import { RouteProvider, RouteProviderInput } from './RouteProvider';
import { Leg, LatLng, Mode } from '../domain/types';
import { getHaversineDistanceM, calculateModeCost } from '../engine/modes';
import { generateLegLabel } from '../engine/labels';
import { NoFeasibleRouteError } from '../engine/errors';
import { PERSONAS } from '../engine/personas';

export class ApproxRouteProvider implements RouteProvider {
  async getLeg(input: RouteProviderInput): Promise<Leg> {
    const straightDistM = getHaversineDistanceM(input.from.location, input.to.location);
    // Straight distance * detour factor (1.3 for walk/bus/pm, 1.4 for taxi)
    const detourFactor = input.allowedModes.includes('taxi') ? 1.4 : 1.3;
    const distanceM = Math.max(10, Math.round(straightDistM * detourFactor));

    const dh = input.to.elevationM - input.from.elevationM;
    const ascentM = Math.max(0, dh);
    const descentM = Math.max(0, -dh);

    // Geometry interpolation between from and to
    const geometry: Array<[number, number, number]> = [
      [input.from.location.lng, input.from.location.lat, input.from.elevationM],
      [input.to.location.lng, input.to.location.lat, input.to.elevationM],
    ];

    // Evaluate allowed modes and pick the one with lowest composite cost
    let bestModeResult: ReturnType<typeof calculateModeCost> | null = null;

    for (const mode of input.allowedModes) {
      const modeResult = calculateModeCost(
        mode,
        {
          from: input.from,
          to: input.to,
          distanceM,
          hasStairs: false,
          covered: input.covered || false,
          weather: input.weather,
          avoidStairs: input.avoidStairs,
          walkingReference: input.walkingReference,
        },
        input.persona
      );

      if (!modeResult.isAllowed) continue;
      if (!input.walkingReference && mode === 'walk' && modeResult.walkDistanceM > PERSONAS[input.persona].maxWalkLegM) continue;

      if (!bestModeResult || modeResult.effortFlatM < bestModeResult.effortFlatM) {
        bestModeResult = modeResult;
      }
    }

    // An unavailable edge must not become a forbidden zero-minute walk.
    if (!bestModeResult) {
      throw new NoFeasibleRouteError(`No allowed mode from ${input.from.poiId} to ${input.to.poiId}`);
    }

    const label = generateLegLabel(
      bestModeResult.mode,
      bestModeResult.durationMin,
      ascentM,
      descentM,
      bestModeResult.costKrw
    );

    return {
      from: {
        poiId: input.from.poiId,
        name: input.from.name,
        location: input.from.location,
        elevationM: input.from.elevationM,
        transitAccess: input.from.transitAccess,
      },
      to: {
        poiId: input.to.poiId,
        name: input.to.name,
        location: input.to.location,
        elevationM: input.to.elevationM,
        transitAccess: input.to.transitAccess,
      },
      mode: bestModeResult.mode,
      distanceM,
      durationMin: bestModeResult.durationMin,
      ascentM,
      descentM,
      walkDistanceM: bestModeResult.walkDistanceM,
      effortFlatM: bestModeResult.effortFlatM,
      costKrw: bestModeResult.costKrw,
      geometry,
      maxUpGradePct: bestModeResult.maxUpGradePct,
      maxDownGradePct: bestModeResult.maxDownGradePct,
      hasStairs: false,
      estimated: true,
      label,
      notes: [],
    };
  }
}
