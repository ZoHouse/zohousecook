import { generateRandomAvatar, resolveConfig } from '../generator';
import { BROS_LAYER_ORDER, BAES_LAYER_ORDER } from '../types';

describe('generateRandomAvatar', () => {
  it('produces a bros config with all BROS_LAYER_ORDER categories', () => {
    const config = generateRandomAvatar('bros');
    expect(config.bodyType).toBe('bros');
    for (const category of BROS_LAYER_ORDER) {
      expect(config.traits).toHaveProperty(category);
    }
  });

  it('produces a baes config with all BAES_LAYER_ORDER categories', () => {
    const config = generateRandomAvatar('baes');
    expect(config.bodyType).toBe('baes');
    for (const category of BAES_LAYER_ORDER) {
      expect(config.traits).toHaveProperty(category);
    }
  });

  it('produces trait IDs that are numbers', () => {
    const config = generateRandomAvatar('bros');
    for (const category of BROS_LAYER_ORDER) {
      expect(typeof config.traits[category]).toBe('number');
    }
  });

  it('applies constraints: bros dress 12 yields head=-1 and beard=-1', () => {
    // Run many times to get a dress=12 hit; mock to force it
    // Instead, directly test: build a config that mirrors what the generator does for dress 12
    // by verifying the constraint is applied in the output
    const results: Array<ReturnType<typeof generateRandomAvatar>> = [];
    for (let i = 0; i < 200; i++) {
      results.push(generateRandomAvatar('bros'));
    }
    const withDress12 = results.filter((r) => r.traits['dress'] === 12);
    for (const r of withDress12) {
      expect(r.traits['head']).toBe(-1);
      expect(r.traits['beard']).toBe(-1);
    }
  });

  it('applies constraints: bros dress 13 yields head=-1 and beard=-1', () => {
    const results: Array<ReturnType<typeof generateRandomAvatar>> = [];
    for (let i = 0; i < 200; i++) {
      results.push(generateRandomAvatar('bros'));
    }
    const withDress13 = results.filter((r) => r.traits['dress'] === 13);
    for (const r of withDress13) {
      expect(r.traits['head']).toBe(-1);
      expect(r.traits['beard']).toBe(-1);
    }
  });
});

describe('resolveConfig', () => {
  it('converts AvatarConfig to TraitSelection for bros', () => {
    const config = {
      bodyType: 'bros' as const,
      traits: {
        background: 0,
        skin: 0,
        dress: 1,
        eyes: 1,
        head: -1,
        beard: 0,
        mouth: 0,
        eyewear: -1,
      },
    };
    const selection = resolveConfig(config);
    expect(selection['background']?.id).toBe(0);
    expect(selection['dress']?.id).toBe(1);
    // id=-1 entries should not be in the selection (they're null/empty traits)
    expect(selection['head']).toBeDefined(); // id=-1 is a valid Trait in the list
    expect(selection['eyewear']).toBeDefined(); // id=-1 is in the traits list
  });

  it('converts AvatarConfig to TraitSelection for baes', () => {
    const config = {
      bodyType: 'baes' as const,
      traits: {
        background: 1,
        skin: 0,
        eyes: 0,
        hair: 0,
        earrings: -1,
        eyewear: -1,
        mouth: 0,
        head: -1,
        dress: 2,
        neck: -1,
      },
    };
    const selection = resolveConfig(config);
    expect(selection['background']?.id).toBe(1);
    expect(selection['dress']?.id).toBe(2);
  });

  it('skips categories with undefined trait IDs', () => {
    const config = {
      bodyType: 'bros' as const,
      traits: {
        background: 0,
        skin: 0,
        dress: 1,
        eyes: 0,
        // head, beard, mouth, eyewear omitted
      },
    };
    const selection = resolveConfig(config);
    expect(selection['background']).toBeDefined();
    expect(selection['head']).toBeUndefined();
    expect(selection['beard']).toBeUndefined();
  });
});
