import { RouteProvider, RouteProviderInput } from './RouteProvider';
import { Leg, LatLng, Mode } from '../domain/types';
import { ApproxRouteProvider } from './approx';
import { calculateModeCost } from '../engine/modes';
import { generateLegLabel } from '../engine/labels';

export class ORSRouteProvider implements RouteProvider {
  private apiKey: string;
  private fallbackProvider: ApproxRouteProvider;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ORS_API_KEY || '';
    this.fallbackProvider = new ApproxRouteProvider();
  }

  async getLeg(input: RouteProviderInput): Promise<Leg> {
    if (!this.apiKey) {
      return this.fallbackProvider.getLeg(input);
    }

    try {
      // Evaluate primary walk/car mode from ORS
      const isTaxi = input.allowedModes.includes('taxi');
      const profile = isTaxi ? 'driving-car' : 'foot-walking';

      const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey,
        },
        body: JSON.stringify({
          coordinates: [
            [input.from.location.lng, input.from.location.lat],
            [input.to.location.lng, input.to.location.lat],
          ],
          elevation: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`ORS API returned status ${response.status}`);
      }

      const data = await response.json();
      const feature = data.features?.[0];
      if (!feature) throw new Error('ORS response missing features');

      const summary = feature.properties?.summary;
      const distanceM = Math.round(summary?.distance || 0);
      const coords = feature.geometry?.coordinates || []; // [[lng, lat, ele], ...]

      // Calculate ascent & descent from ORS elevation geometry
      let ascentM = 0;
      let descentM = 0;
      const geometry: Array<[number, number, number]> = [];

      for (let i = 0; i < coords.length; i++) {
        const [lng, lat, ele = 0] = coords[i];
        geometry.push([lng, lat, ele]);

        if (i > 0) {
          const prevEle = coords[i - 1][2] || 0;
          const diff = ele - prevEle;
          if (diff > 0) ascentM += diff;
          else descentM += Math.abs(diff);
        }
      }

      ascentM = Math.round(ascentM);
      descentM = Math.round(descentM);

      // Best mode evaluation using actual distance
      let bestModeResult = calculateModeCost(
        isTaxi ? 'taxi' : 'walk',
        {
          from: input.from,
          to: input.to,
          distanceM,
          hasStairs: false,
          covered: input.covered || false,
          weather: input.weather,
          avoidStairs: input.avoidStairs,
        },
        input.persona
      );

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
        },
        to: {
          poiId: input.to.poiId,
          name: input.to.name,
          location: input.to.location,
          elevationM: input.to.elevationM,
        },
        mode: bestModeResult.mode,
        distanceM,
        durationMin: bestModeResult.durationMin,
        ascentM,
        descentM,
        walkDistanceM: bestModeResult.walkDistanceM,
        effortFlatM: bestModeResult.effortFlatM,
        costKrw: bestModeResult.costKrw,
        geometry: geometry.length > 0 ? geometry : [
          [input.from.location.lng, input.from.location.lat, input.from.elevationM],
          [input.to.location.lng, input.to.location.lat, input.to.elevationM],
        ],
        maxUpGradePct: bestModeResult.maxUpGradePct,
        maxDownGradePct: bestModeResult.maxDownGradePct,
        hasStairs: false,
        estimated: false,
        label,
        notes: [],
      };
    } catch (err) {
      // Fallback to ApproxRouteProvider on ORS failure
      const fallbackLeg = await this.fallbackProvider.getLeg(input);
      fallbackLeg.notes.push('ORS API 호출 실패로 근사(Approx) 알고리즘으로 계산되었습니다.');
      return fallbackLeg;
    }
  }
}
