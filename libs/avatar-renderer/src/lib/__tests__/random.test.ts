import { weightedRandom } from '../random';
import { Trait } from '../types';

describe('weightedRandom', () => {
  it('returns a trait from the list', () => {
    const traits: Trait[] = [
      { id: 0, name: 'A', weight: 5 },
      { id: 1, name: 'B', weight: 5 },
    ];
    const result = weightedRandom(traits);
    expect(traits).toContainEqual(result);
  });

  it('respects weights over many iterations', () => {
    const traits: Trait[] = [
      { id: 0, name: 'Heavy', weight: 100 },
      { id: 1, name: 'Light', weight: 1 },
    ];
    const counts = { 0: 0, 1: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[weightedRandom(traits).id as 0 | 1]++;
    }
    expect(counts[0]).toBeGreaterThan(900);
  });

  it('falls back to uniform random when all weights are 0', () => {
    const traits: Trait[] = [
      { id: 0, name: 'A', weight: 0 },
      { id: 1, name: 'B', weight: 0 },
      { id: 2, name: 'C', weight: 0 },
    ];
    const ids = new Set<number>();
    for (let i = 0; i < 300; i++) {
      ids.add(weightedRandom(traits).id);
    }
    expect(ids.size).toBe(3);
  });

  it('handles single-item list', () => {
    const traits: Trait[] = [{ id: 0, name: 'Only', weight: 5 }];
    expect(weightedRandom(traits)).toEqual(traits[0]);
  });
});
