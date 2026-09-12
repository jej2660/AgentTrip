import { describe, it, expect } from 'vitest';
import { RouteRequestSchema } from '@/lib/domain/schema';

describe('RouteRequestSchema', () => {
  it('validates a correct route request', () => {
    const validRequest = {
      regionId: 'dongincheon',
      start: { poiId: 'dongincheon:station' },
      poiIds: ['dongincheon:jayu-park', 'dongincheon:sinpo-market'],
      persona: 'toad',
      allowedModes: ['walk', 'taxi'],
      car: { enabled: false },
      avoidStairs: false,
      weather: 'clear',
      note: '무릎이 조금 아파요',
    };

    const result = RouteRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('fails if walk mode is missing from allowedModes', () => {
    const invalidRequest = {
      regionId: 'dongincheon',
      start: { poiId: 'dongincheon:station' },
      poiIds: ['dongincheon:jayu-park'],
      persona: 'toad',
      allowedModes: ['taxi'],
      car: { enabled: false },
      avoidStairs: false,
      weather: 'clear',
    };

    const result = RouteRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });
});
