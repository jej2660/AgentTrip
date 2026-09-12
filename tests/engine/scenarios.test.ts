import { describe, it, expect } from 'vitest';
import { generateEnginePlan } from '@/lib/engine/plan';
import { RouteRequest } from '@/lib/domain/types';

describe('Section 14 Demo Scenarios (Engine Path)', () => {
  const commonRequest: Omit<RouteRequest, 'persona'> = {
    regionId: 'dongincheon',
    start: { poiId: 'dongincheon:station' },
    poiIds: [
      'dongincheon:jayu-park',
      'dongincheon:sinpo-market',
      'dongincheon:dapdong-cathedral',
      'dongincheon:songhyeon-park',
    ],
    allowedModes: ['walk', 'taxi', 'bus', 'pm'],
    car: { enabled: false },
    avoidStairs: false,
    weather: 'clear',
  };

  it('Scenario 1: Toad Persona (No uphill walk, >=1 taxi leg, no stairs)', async () => {
    const plan = await generateEnginePlan({
      ...commonRequest,
      persona: 'toad',
    });

    expect(plan.invariants.ok).toBe(true);
    const taxiLegs = plan.legs.filter((l) => l.mode === 'taxi');
    expect(taxiLegs.length).toBeGreaterThanOrEqual(1);

    // No significant uphill walk
    const uphillWalkLegs = plan.legs.filter(
      (l) => l.mode === 'walk' && l.ascentM >= 10
    );
    expect(uphillWalkLegs.length).toBe(0);
    expect(plan.savings.uphillWalkReductionPct).toBeGreaterThan(0);
  });

  it('Scenario 2: Turtle Persona (Total walk ascent <= 10m, 0 taxi if bus available)', async () => {
    const plan = await generateEnginePlan({
      ...commonRequest,
      persona: 'turtle',
    });

    expect(plan.invariants.ok).toBe(true);
    const walkAscentTotal = plan.legs
      .filter((l) => l.mode === 'walk')
      .reduce((sum, l) => sum + l.ascentM, 0);
    expect(walkAscentTotal).toBeLessThanOrEqual(10);

    const taxiLegs = plan.legs.filter((l) => l.mode === 'taxi');
    expect(taxiLegs.length).toBe(0);
  });

  it('Scenario 3: Rabbit Persona (Bus <= 1 leg, leg ascent <= 40m)', async () => {
    const plan = await generateEnginePlan({
      ...commonRequest,
      persona: 'rabbit',
    });

    expect(plan.invariants.ok).toBe(true);
    const busLegs = plan.legs.filter((l) => l.mode === 'bus');
    expect(busLegs.length).toBeLessThanOrEqual(1);

    plan.legs.forEach((l) => {
      if (l.mode === 'walk') {
        expect(l.ascentM).toBeLessThanOrEqual(40);
      }
    });
  });

  it('Scenario 4: Sloth Persona with 5 POIs (Skips POIs within budget)', async () => {
    const plan = await generateEnginePlan({
      ...commonRequest,
      poiIds: [
        'dongincheon:jayu-park',
        'dongincheon:sinpo-market',
        'dongincheon:dapdong-cathedral',
        'dongincheon:songhyeon-park',
        'dongincheon:chinatown',
      ],
      persona: 'sloth',
    });

    expect(plan.invariants.ok).toBe(true);
    expect(plan.order.length).toBeLessThan(7); // start + end + kept POIs
    expect(plan.skipped.length).toBeGreaterThan(0);
  });

  it('Scenario 5: Car Basecamp Auto Selection', async () => {
    const plan = await generateEnginePlan({
      ...commonRequest,
      persona: 'toad',
      car: { enabled: true, parkingId: 'auto' },
    });

    expect(plan.invariants.ok).toBe(true);
    expect(plan.order[0]).toBe(plan.order[plan.order.length - 1]); // Loop start == end
    expect(plan.parkingRecommendation).toBeDefined();
    expect(plan.parkingRecommendation?.reason).not.toBe('');
  });
});
