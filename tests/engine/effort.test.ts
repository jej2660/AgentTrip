import { describe, it, expect } from 'vitest';
import { calculateWalkEffortFlatM, calculateWalkDurationMin } from '@/lib/engine/effort';

describe('Effort & Tobler Functions', () => {
  it('calculates flat walking effort correctly', () => {
    const effort = calculateWalkEffortFlatM(
      { distanceM: 1000, elevationDiffM: 0, hasStairs: false, covered: false },
      'toad',
      'clear'
    );
    expect(effort).toBe(1000);
  });

  it('applies uphill multiplier W_UP = 8', () => {
    const effort = calculateWalkEffortFlatM(
      { distanceM: 1000, elevationDiffM: 50, hasStairs: false, covered: false },
      'toad',
      'clear'
    );
    // 1000 + 8 * 50 = 1400
    expect(effort).toBe(1400);
  });

  it('applies rabbit persona wUp x 4 multiplier', () => {
    const effort = calculateWalkEffortFlatM(
      { distanceM: 1000, elevationDiffM: 50, hasStairs: false, covered: false },
      'rabbit',
      'clear'
    );
    // 1000 + (8 * 4) * 50 = 2600
    expect(effort).toBe(2600);
  });

  it('calculates Tobler walking duration', () => {
    const flatDur = calculateWalkDurationMin(1000, 0);
    const uphillDur = calculateWalkDurationMin(1000, 100);

    expect(flatDur).toBeGreaterThan(0);
    expect(uphillDur).toBeGreaterThan(flatDur); // Uphill walking takes longer
  });
});
