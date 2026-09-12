import { Leg, Metrics, Savings } from '../domain/types';

export function calculateMetrics(legs: Leg[], stayMinTotal: number = 0): Metrics {
  let walkDistanceM = 0;
  let uphillWalkM = 0;
  let ascentWalkM = 0;
  let effortFlatM = 0;
  let moveMin = 0;
  let costKrw = 0;

  for (const leg of legs) {
    walkDistanceM += leg.walkDistanceM;
    effortFlatM += leg.effortFlatM;
    moveMin += leg.durationMin;
    costKrw += leg.costKrw;

    if (leg.mode === 'walk') {
      if (leg.ascentM > 0) {
        uphillWalkM += leg.distanceM;
        ascentWalkM += leg.ascentM;
      }
    }
  }

  const steps = Math.round(walkDistanceM / 0.7);
  const totalMin = Math.ceil(moveMin + stayMinTotal);

  return {
    walkDistanceM: Math.round(walkDistanceM),
    uphillWalkM: Math.round(uphillWalkM),
    ascentWalkM: Math.round(ascentWalkM),
    effortFlatM: Math.round(effortFlatM),
    steps,
    moveMin: Math.ceil(moveMin),
    totalMin,
    costKrw,
  };
}

export function calculateSavings(opt: Metrics, base: Metrics): Savings {
  let uphillWalkReductionPct = 0;
  if (base.uphillWalkM > 0) {
    uphillWalkReductionPct = Math.max(
      0,
      Math.min(100, Math.round((1 - opt.uphillWalkM / base.uphillWalkM) * 100))
    );
  }

  const effortSavedKm = Math.max(0, Number(((base.effortFlatM - opt.effortFlatM) / 1000).toFixed(1)));
  const extraCostKrw = Math.max(0, opt.costKrw - base.costKrw);
  const extraTimeMin = Math.max(0, opt.totalMin - base.totalMin);

  return {
    uphillWalkReductionPct,
    effortSavedKm,
    extraCostKrw,
    extraTimeMin,
  };
}
