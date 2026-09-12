import { Poi, Metrics } from '../domain/types';

export interface SlothSkipResult {
  keptPois: Poi[];
  skipped: Array<{ poiId: string; reason: string }>;
}

export function applySlothSkip(
  pois: Poi[],
  effortBudget: number,
  calculateEffortFn: (selectedPois: Poi[]) => number
): SlothSkipResult {
  let currentPois = [...pois];
  const skipped: Array<{ poiId: string; reason: string }> = [];

  // Minimum 2 POIs must be kept
  while (currentPois.length > 2) {
    const currentEffort = calculateEffortFn(currentPois);
    if (currentEffort <= effortBudget) {
      break;
    }

    // Find POI with highest (effort reduction / priority weight) ratio
    // Priority weights: priority 1 -> 3, priority 2 -> 2, priority 3 -> 1
    let bestCandidateIndex = -1;
    let maxScore = -1;

    for (let i = 0; i < currentPois.length; i++) {
      const candidatePois = currentPois.filter((_, idx) => idx !== i);
      const newEffort = calculateEffortFn(candidatePois);
      const effortSaved = currentEffort - newEffort;

      const priorityWeight = currentPois[i].priority === 1 ? 3 : currentPois[i].priority === 2 ? 2 : 1;
      const score = effortSaved / priorityWeight;

      if (score > maxScore) {
        maxScore = score;
        bestCandidateIndex = i;
      }
    }

    if (bestCandidateIndex !== -1) {
      const removedPoi = currentPois[bestCandidateIndex];
      const effortBefore = calculateEffortFn(currentPois);
      currentPois = currentPois.filter((_, idx) => idx !== bestCandidateIndex);
      const effortAfter = calculateEffortFn(currentPois);
      const savedM = Math.round(effortBefore - effortAfter);

      skipped.push({
        poiId: removedPoi.id,
        reason: `체력 예산(${effortBudget}m) 초과로 제외 (고도 및 우회 거리 ${savedM}m 절감)`,
      });
    } else {
      break;
    }
  }

  return {
    keptPois: currentPois,
    skipped,
  };
}
