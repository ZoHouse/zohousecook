import { AvatarConfig, BodyType, BROS_LAYER_ORDER, BAES_LAYER_ORDER, TraitSelection } from './types';
import { getTraits } from './traits';
import { weightedRandom } from './random';
import { applyConstraintsBros, applyConstraintsBaes } from './constraints';

export function generateRandomAvatar(bodyType: BodyType): AvatarConfig {
  const layerOrder = bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
  const selection: TraitSelection = {};
  for (const category of layerOrder) {
    selection[category] = weightedRandom(getTraits(bodyType, category));
  }
  const constrained =
    bodyType === 'bros'
      ? applyConstraintsBros(selection)
      : applyConstraintsBaes(selection);

  const traits: Record<string, number> = {};
  for (const category of layerOrder) {
    traits[category] = constrained[category]?.id ?? -1;
  }
  return { bodyType, traits };
}

export function resolveConfig(config: AvatarConfig): TraitSelection {
  const layerOrder = config.bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
  const selection: TraitSelection = {};
  for (const category of layerOrder) {
    const traitId = config.traits[category];
    if (traitId === undefined) continue;
    const found = getTraits(config.bodyType, category).find((t) => t.id === traitId);
    if (found) selection[category] = found;
  }
  return selection;
}
