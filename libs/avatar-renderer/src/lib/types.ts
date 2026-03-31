/** A single selectable trait option within a category. */
export interface Trait {
  id: number;
  name: string | null;
  weight: number;
}

export type BodyType = 'bros' | 'baes';

export type BrosCategory = 'background' | 'skin' | 'dress' | 'eyes' | 'head' | 'beard' | 'mouth' | 'eyewear';
export type BaesCategory = 'background' | 'skin' | 'eyes' | 'hair' | 'earrings' | 'eyewear' | 'mouth' | 'head' | 'dress' | 'neck';
export type TraitCategory = BrosCategory | BaesCategory;

export const BROS_LAYER_ORDER: BrosCategory[] = [
  'background', 'skin', 'dress', 'eyes', 'head', 'beard', 'mouth', 'eyewear',
];

export const BAES_LAYER_ORDER: BaesCategory[] = [
  'background', 'skin', 'eyes', 'hair', 'earrings', 'eyewear', 'mouth', 'head', 'dress', 'neck',
];

export interface AvatarConfig {
  bodyType: BodyType;
  traits: Record<string, number>;
}

export type TraitSelection = Record<string, Trait>;

export interface AvatarAttribute {
  trait_type: string;
  value: string | null;
}
