import { Poi, Mode, PersonaId, Weather, Leg } from '../domain/types';
import { RouteProvider } from '../providers/RouteProvider';
import { NoFeasibleRouteError } from './errors';
import { checkInvariants } from './invariants';

export interface MatrixCell {
  leg: Leg;
  fromPoiId: string;
  toPoiId: string;
  bestMode: Mode;
  costKrw: number;
  durationMin: number;
  walkDistanceM: number;
  effortFlatM: number;
  distanceM: number;
  ascentM: number;
  descentM: number;
}

export async function buildCostMatrix(
  pois: Poi[],
  allowedModes: Mode[],
  persona: PersonaId,
  weather: Weather,
  avoidStairs: boolean,
  provider: RouteProvider,
  walkingReference = false
): Promise<Map<string, MatrixCell>> {
  const matrix = new Map<string, MatrixCell>();

  for (const from of pois) {
    for (const to of pois) {
      if (from.id === to.id) continue;

      const key = `${from.id}->${to.id}`;
      let leg: Leg;
      try {
      leg = await provider.getLeg({
        from: {
          poiId: from.id,
          name: from.name,
          location: from.location,
          elevationM: from.elevationM,
          transitAccess: from.transitAccess,
        },
        to: {
          poiId: to.id,
          name: to.name,
          location: to.location,
          elevationM: to.elevationM,
          transitAccess: to.transitAccess,
          vehicleDropOff: to.vehicleDropOff,
        },
        allowedModes,
        persona,
        weather,
        avoidStairs,
        covered: to.covered,
        walkingReference,
      });
      } catch (error) {
        if (error instanceof NoFeasibleRouteError) continue;
        throw error;
      }
      if (!walkingReference && !checkInvariants([leg], persona, weather, avoidStairs, allowedModes).ok) continue;

      matrix.set(key, {
        leg,
        fromPoiId: from.id,
        toPoiId: to.id,
        bestMode: leg.mode,
        costKrw: leg.costKrw,
        durationMin: leg.durationMin,
        walkDistanceM: leg.walkDistanceM,
        effortFlatM: leg.effortFlatM,
        distanceM: leg.distanceM,
        ascentM: leg.ascentM,
        descentM: leg.descentM,
      });
    }
  }

  return matrix;
}
