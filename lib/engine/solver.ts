import { Poi, Mode, PersonaId, Weather, Leg } from '../domain/types';
import { RouteProvider } from '../providers/RouteProvider';
import { buildCostMatrix, MatrixCell } from './matrix';
import { checkInvariants } from './invariants';

export interface PermutationCandidate {
  order: string[]; // POI IDs in visit order
  legs: Leg[];
  totalCost: number;
  totalEffortFlatM: number;
  invariantsOk: boolean;
}

// Generate permutations of POI IDs (excluding start/end if fixed)
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

export async function solveRouteOrder(
  startPoi: Poi,
  endPoi: Poi | null, // If loop, endPoi === startPoi
  targetPois: Poi[], // POIs to visit (1..8)
  allowedModes: Mode[],
  persona: PersonaId,
  weather: Weather,
  avoidStairs: boolean,
  provider: RouteProvider,
  topK: number = 3,
  walkingReference = false
): Promise<PermutationCandidate[]> {
  const allPois = [startPoi, ...targetPois];
  if (endPoi && endPoi.id !== startPoi.id) {
    allPois.push(endPoi);
  }

  // Stage A: Matrix build
  const matrix = await buildCostMatrix(allPois, allowedModes, persona, weather, avoidStairs, provider, walkingReference);

  // Stage B: Permutation search
  const poiIdsToPermute = targetPois.map((p) => p.id);
  const permutations = getPermutations(poiIdsToPermute);

  const scoredCandidates: Array<{ order: string[]; cost: number; effortFlatM: number; monotonicDescentScore: number }> = [];

  for (const perm of permutations) {
    const fullOrder = [startPoi.id, ...perm];
    if (endPoi) {
      fullOrder.push(endPoi.id);
    }

    let permCost = 0;
    let permEffort = 0;
    let monotonicDescentScore = 0;

    for (let i = 0; i < fullOrder.length - 1; i++) {
      const fromId = fullOrder[i];
      const toId = fullOrder[i + 1];
      const cell = matrix.get(`${fromId}->${toId}`);
      if (!cell) {
        permCost = Infinity;
        break;
      }
      if (cell) {
        permCost += walkingReference ? cell.distanceM : cell.effortFlatM + cell.costKrw + cell.durationMin * 0.5;
        permEffort += cell.effortFlatM;

        // Monotonic descent incentive: favor legs going downhill
        if (!walkingReference && cell.descentM > cell.ascentM) {
          monotonicDescentScore += cell.descentM - cell.ascentM;
        }
      }
    }

    if (!Number.isFinite(permCost)) continue;
    scoredCandidates.push({
      order: fullOrder,
      cost: permCost - monotonicDescentScore * 0.1, // tie-breaker favor downhill sequence
      effortFlatM: permEffort,
      monotonicDescentScore,
    });
  }

  // Sort by composite cost ascending
  scoredCandidates.sort((a, b) => a.cost - b.cost);
  const topCandidates = scoredCandidates.slice(0, topK);

  // Stage C: Real leg construction
  const results: PermutationCandidate[] = [];

  for (const candidate of topCandidates) {
    const legs: Leg[] = [];
    let candidateCost = 0;
    let candidateEffort = 0;

    for (let i = 0; i < candidate.order.length - 1; i++) {
      const fromId = candidate.order[i];
      const toId = candidate.order[i + 1];

      const leg = matrix.get(`${fromId}->${toId}`)!.leg;

      legs.push(leg);
      candidateCost += leg.costKrw;
      candidateEffort += leg.effortFlatM;
    }

    const invariantsReport = checkInvariants(legs, persona, weather, avoidStairs, allowedModes);

    results.push({
      order: candidate.order,
      legs,
      totalCost: candidateCost,
      totalEffortFlatM: candidateEffort,
      invariantsOk: invariantsReport.ok,
    });
  }

  return results;
}
