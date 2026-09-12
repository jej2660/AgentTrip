import { ENGINE_CONFIG } from './config';
import { PersonaId, Weather } from '../domain/types';

export interface EffortInput {
  distanceM: number;
  elevationDiffM: number; // dh = elevationTo - elevationFrom
  hasStairs: boolean;
  covered: boolean;
}

export function calculateWalkEffortFlatM(
  input: EffortInput,
  persona: PersonaId,
  weather: Weather = 'clear'
): number {
  const { distanceM: d, elevationDiffM: dh, hasStairs, covered } = input;
  if (d <= 0) return 0;

  const g = dh / d;
  let E = 0;

  let wUp = ENGINE_CONFIG.W_UP;
  if (persona === 'rabbit') {
    wUp *= 4;
  }

  if (g >= 0) {
    E = d + wUp * dh;
  } else if (Math.abs(g) <= ENGINE_CONFIG.STEEP_DOWN_PCT) {
    E = Math.max(0.6 * d, d - ENGINE_CONFIG.W_DOWN * Math.abs(dh));
  } else {
    E = d + ENGINE_CONFIG.W_STEEP * Math.abs(dh);
  }

  let stairsMult = ENGINE_CONFIG.STAIRS_MULT;
  let steepMult = 1.0;

  if (weather === 'rain') {
    stairsMult *= 2.0;
    if (g < -ENGINE_CONFIG.STEEP_DOWN_PCT) {
      steepMult *= 2.0;
    }
  }

  if (hasStairs) {
    E *= stairsMult;
  }
  if (g < -ENGINE_CONFIG.STEEP_DOWN_PCT) {
    E *= steepMult;
  }

  if (weather === 'heat' && !covered) {
    E *= 1.3;
  }

  return E;
}

export function calculateWalkDurationMin(
  distanceM: number,
  elevationDiffM: number
): number {
  if (distanceM <= 0) return 0;
  const g = elevationDiffM / distanceM;
  // Tobler hiking function: v_kmh = 6 * exp(-3.5 * |g + 0.05|)
  const vKmh = Math.max(1.5, 6 * Math.exp(-3.5 * Math.abs(g + 0.05)));
  return (distanceM / 1000 / vKmh) * 60;
}
