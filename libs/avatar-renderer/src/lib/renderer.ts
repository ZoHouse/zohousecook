import { AvatarConfig, AvatarAttribute, TraitSelection, BROS_LAYER_ORDER, BAES_LAYER_ORDER } from './types';

const SVG_OPEN_REGEX = /^<svg[^>]*>/;
const SVG_CLOSE = '</svg>';

export function stripSvgWrapper(svg: string): string {
  if (!svg) return '';
  let inner = svg.replace(SVG_OPEN_REGEX, '');
  const lastClose = inner.lastIndexOf(SVG_CLOSE);
  if (lastClose !== -1) {
    inner = inner.slice(0, lastClose) + inner.slice(lastClose + SVG_CLOSE.length);
  }
  return inner;
}

export function compositeAvatar(layerContents: string[]): string {
  const inner = layerContents.filter(Boolean).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="none" viewBox="0 0 512 512">${inner}</svg>`;
}

export async function loadAsset(
  baseUrl: string,
  bodyType: string,
  category: string,
  traitId: number
): Promise<string> {
  if (traitId === -1) return '';
  try {
    const url = `${baseUrl}/${bodyType}/${category}/${traitId}.svg`;
    const response = await fetch(url);
    if (!response.ok) return '';
    const svgText = await response.text();
    return stripSvgWrapper(svgText);
  } catch {
    return '';
  }
}

export async function renderAvatar(config: AvatarConfig, baseUrl: string): Promise<string> {
  const layerOrder = config.bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
  const layerPromises = layerOrder.map((category) => {
    const traitId = config.traits[category];
    if (traitId === undefined || traitId === -1) return Promise.resolve('');
    return loadAsset(baseUrl, config.bodyType, category, traitId);
  });
  const layers = await Promise.all(layerPromises);
  return compositeAvatar(layers);
}

export function buildAttributes(bodyType: string, selection: TraitSelection): AvatarAttribute[] {
  const gender = bodyType === 'bros' ? 'male' : 'female';
  const layerOrder = bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
  return [
    { trait_type: 'gender', value: gender },
    ...layerOrder.map((cat) => ({ trait_type: cat, value: selection[cat]?.name ?? null })),
  ];
}
