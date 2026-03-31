import { BodyType, Trait } from '../types';
import { brosTraits } from './bros';
import { baesTraits } from './baes';

const allTraits: Record<string, Record<string, Trait[]>> = {
  bros: brosTraits,
  baes: baesTraits,
};

export function getTraits(bodyType: BodyType, category: string): Trait[] {
  const bodyTraits = allTraits[bodyType];
  if (!bodyTraits) throw new Error(`Unknown body type: ${bodyType}`);
  const categoryTraits = bodyTraits[category];
  if (!categoryTraits) throw new Error(`Unknown category "${category}" for body type "${bodyType}"`);
  return categoryTraits;
}

export function getCategories(bodyType: BodyType): string[] {
  return Object.keys(allTraits[bodyType]);
}

export { allTraits, brosTraits, baesTraits };
