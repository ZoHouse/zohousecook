import { Trait } from './types';

export function weightedRandom(traits: Trait[]): Trait {
  if (traits.length === 0) throw new Error('Cannot select from empty trait list');
  if (traits.length === 1) return traits[0];

  const totalWeight = traits.reduce((sum, t) => sum + t.weight, 0);

  if (totalWeight === 0) {
    return traits[Math.floor(Math.random() * traits.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const trait of traits) {
    roll -= trait.weight;
    if (roll <= 0) return trait;
  }
  return traits[traits.length - 1];
}
