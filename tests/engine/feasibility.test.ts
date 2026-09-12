import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/route/engine/route';
import { generateEnginePlan } from '@/lib/engine/plan';
import { RouteRequest } from '@/lib/domain/types';
import { calculateWalkEffortFlatM } from '@/lib/engine/effort';

const request: RouteRequest = {
  regionId: 'dongincheon', start: { poiId: 'dongincheon:station' },
  poiIds: ['dongincheon:jayu-park'], persona: 'toad', allowedModes: ['walk'],
  car: { enabled: false }, avoidStairs: false, weather: 'clear',
};
const post = (body: unknown) => POST(new Request('http://localhost/api/route/engine', {
  method: 'POST', body: JSON.stringify(body),
}));

describe('Route feasibility and validation', () => {
  it('returns 422 when no allowed route can reach the uphill target', async () => {
    const response = await post(request);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: 'NO_FEASIBLE_ROUTE' });
  });

  it.each([
    { regionId: 'unknown' }, { poiIds: ['unknown'] },
    { start: { poiId: 'unknown' } }, { start: { lat: 91, lng: 0 } },
    { poiIds: ['dongincheon:jayu-park', 'dongincheon:jayu-park'] },
  ])('rejects invalid input %j with 400', async (change) => {
    expect((await post({ ...request, ...change })).status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await POST(new Request('http://localhost/api/route/engine', { method: 'POST', body: '{' }));
    expect(response.status).toBe(400);
  });

  it('can omit an unavailable edge while finding a feasible order', async () => {
    const plan = await generateEnginePlan({ ...request,
      start: { poiId: 'dongincheon:jayu-park' }, persona: 'rabbit',
      poiIds: ['dongincheon:station', 'dongincheon:incheon-station'],
      allowedModes: ['walk', 'taxi', 'bus'],
    });
    expect(plan.invariants.ok).toBe(true);
    expect(plan.legs.every(leg => leg.durationMin > 0)).toBe(true);
  });

  it('uses the requested persona effort formula for the walking reference', async () => {
    const plan = await generateEnginePlan({ ...request, allowedModes: ['walk', 'taxi'] });
    expect(plan.baseline.effortFlatM).toBe(Math.round(calculateWalkEffortFlatM({
      distanceM: plan.baseline.walkDistanceM, elevationDiffM: 59, hasStairs: false, covered: false,
    }, 'toad')));
  });
});
