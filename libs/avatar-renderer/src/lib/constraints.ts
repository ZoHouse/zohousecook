import { AvatarConfig, BAES_LAYER_ORDER, BROS_LAYER_ORDER, Trait, TraitSelection } from './types';
import { getTraits } from './traits';
import { weightedRandom } from './random';

// Baes neck allow-list: dresses that allow a neck accessory
const BAES_NECK_ALLOWED_DRESS_IDS = new Set([1, 2, 5, 6, 7, 8, 9, 11, 12, 38, 40, 43]);

function rerollBackground(bodyType: 'bros' | 'baes', excludeId: number): Trait {
  const backgrounds = getTraits(bodyType, 'background').filter((t) => t.id !== excludeId);
  return weightedRandom(backgrounds);
}

export function applyConstraintsBros(selection: TraitSelection): TraitSelection {
  const result = { ...selection };

  const dress = result['dress'];
  const head = result['head'];
  const eyewear = result['eyewear'];

  // dress 12 or 13 → remove head and beard
  if (dress && [12, 13].includes(dress.id)) {
    delete result['head'];
    delete result['beard'];
  }

  // head 16 or 18 → remove beard and eyewear
  if (head && [16, 18].includes(head.id)) {
    delete result['beard'];
    delete result['eyewear'];
  }

  // head 5 → remove beard and mouth
  if (head && head.id === 5) {
    delete result['beard'];
    delete result['mouth'];
  }

  // Background reroll rules
  const bg = result['background'];
  if (bg) {
    if (eyewear && [12, 18, 20].includes(eyewear.id) && bg.id === 5) {
      result['background'] = rerollBackground('bros', 5);
    }
    if (eyewear && eyewear.id === 10 && bg.id === 0) {
      result['background'] = rerollBackground('bros', 0);
    }
    if (head && head.id === 49 && bg.id === 0) {
      result['background'] = rerollBackground('bros', 0);
    }
    if (dress && [2, 38].includes(dress.id) && bg.id === 0) {
      result['background'] = rerollBackground('bros', 0);
    }
    if (dress && dress.id === 50 && bg.id === 1) {
      result['background'] = rerollBackground('bros', 1);
    }
    if (dress && [30, 32, 45, 47].includes(dress.id) && bg.id === 4) {
      result['background'] = rerollBackground('bros', 4);
    }
    if (dress && [3, 10, 17, 22, 41, 59].includes(dress.id) && bg.id === 6) {
      result['background'] = rerollBackground('bros', 6);
    }
    // Python line 479 bug fixed: use getTraits instead of traits["bros"]
    if (dress && dress.id === 43 && bg.id === 7) {
      result['background'] = rerollBackground('bros', 7);
    }
  }

  return result;
}

export function applyConstraintsBaes(selection: TraitSelection): TraitSelection {
  const result = { ...selection };

  const dress = result['dress'];
  const eyewear = result['eyewear'];

  // dress 13 → remove head, neck, hair, earrings
  if (dress && dress.id === 13) {
    delete result['head'];
    delete result['neck'];
    delete result['hair'];
    delete result['earrings'];
  }

  // Most dresses remove neck; only allow-list preserves it
  if (dress && !BAES_NECK_ALLOWED_DRESS_IDS.has(dress.id)) {
    delete result['neck'];
  }

  // Background reroll rules
  const bg = result['background'];
  if (bg) {
    if (eyewear && [12, 18].includes(eyewear.id) && bg.id === 6) {
      result['background'] = rerollBackground('baes', 6);
    }
    if (eyewear && eyewear.id === 10 && bg.id === 0) {
      result['background'] = rerollBackground('baes', 0);
    }
    if (dress && dress.id === 0 && bg.id === 3) {
      result['background'] = rerollBackground('baes', 3);
    }
    if (dress && [19, 20, 29].includes(dress.id) && bg.id === 4) {
      result['background'] = rerollBackground('baes', 4);
    }
    if (dress && [13, 16, 33].includes(dress.id) && bg.id === 6) {
      result['background'] = rerollBackground('baes', 6);
    }
    if (dress && [3, 14, 34, 43].includes(dress.id) && bg.id === 7) {
      result['background'] = rerollBackground('baes', 7);
    }
    if (dress && dress.id === 42 && bg.id === 8) {
      result['background'] = rerollBackground('baes', 8);
    }
  }

  return result;
}

/**
 * Unified constraint resolver. Converts AvatarConfig to TraitSelection,
 * applies body-type-specific constraints, and converts back to AvatarConfig.
 */
export function applyConstraints(config: AvatarConfig): AvatarConfig {
  const layerOrder = config.bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;

  // Build a TraitSelection from the AvatarConfig
  const selection: TraitSelection = {};
  for (const category of layerOrder) {
    const traitId = config.traits[category];
    if (traitId === undefined) continue;
    // Find the actual trait object; for id=-1 use a null-name placeholder
    const found = getTraits(config.bodyType, category).find((t) => t.id === traitId);
    if (found) {
      selection[category] = found;
    } else {
      // traitId doesn't exist in the list — store as placeholder (will be -1)
      selection[category] = { id: traitId, name: null, weight: 0 };
    }
  }

  const constrained =
    config.bodyType === 'bros'
      ? applyConstraintsBros(selection)
      : applyConstraintsBaes(selection);

  // Convert back to AvatarConfig
  const traits: Record<string, number> = {};
  for (const category of layerOrder) {
    traits[category] = constrained[category]?.id ?? -1;
  }

  return { bodyType: config.bodyType, traits };
}
