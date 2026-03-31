import { applyConstraintsBros, applyConstraintsBaes, applyConstraints } from '../constraints';
import { Trait, TraitSelection, AvatarConfig } from '../types';

function makeTrait(id: number, name: string | null = null): Trait {
  return { id, name, weight: 1 };
}

describe('applyConstraintsBros', () => {
  it('dress 12 removes head and beard', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(12, 'Hack'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(1, 'Noogle'),
      beard: makeTrait(0, 'Washington'),
      mouth: makeTrait(0, 'Sherlock'),
      eyewear: makeTrait(-1, null),
    };
    const result = applyConstraintsBros(selection);
    expect(result['head']).toBeUndefined();
    expect(result['beard']).toBeUndefined();
  });

  it('dress 13 removes head and beard', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(13, 'Eminem'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(5, 'Samurai'),
      beard: makeTrait(2, 'Tehran'),
      mouth: makeTrait(1, 'Gurgaon'),
      eyewear: makeTrait(-1, null),
    };
    const result = applyConstraintsBros(selection);
    expect(result['head']).toBeUndefined();
    expect(result['beard']).toBeUndefined();
  });

  it('head 5 removes beard and mouth', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(0, 'Amsterdam'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(5, 'Samurai'),
      beard: makeTrait(1, 'Austin'),
      mouth: makeTrait(2, '420'),
      eyewear: makeTrait(-1, null),
    };
    const result = applyConstraintsBros(selection);
    expect(result['beard']).toBeUndefined();
    expect(result['mouth']).toBeUndefined();
  });

  it('head 16 removes beard and eyewear', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(0, 'Amsterdam'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(16, 'Sparta'),
      beard: makeTrait(3, 'Hulk'),
      mouth: makeTrait(0, 'Sherlock'),
      eyewear: makeTrait(5, 'Potter'),
    };
    const result = applyConstraintsBros(selection);
    expect(result['beard']).toBeUndefined();
    expect(result['eyewear']).toBeUndefined();
  });

  it('head 18 removes beard and eyewear', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(0, 'Amsterdam'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(18, 'Scotland'),
      beard: makeTrait(4, 'Lebanon'),
      mouth: makeTrait(0, 'Sherlock'),
      eyewear: makeTrait(2, 'Matrix'),
    };
    const result = applyConstraintsBros(selection);
    expect(result['beard']).toBeUndefined();
    expect(result['eyewear']).toBeUndefined();
  });

  it('eyewear 12 + background 5 rerolls background away from 5', () => {
    const selection: TraitSelection = {
      background: makeTrait(5, 'Superman'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(0, 'Amsterdam'),
      eyes: makeTrait(0, 'Angry'),
      head: makeTrait(-1, null),
      beard: makeTrait(-1, null),
      mouth: makeTrait(0, 'Sherlock'),
      eyewear: makeTrait(12, 'Love'),
    };
    const result = applyConstraintsBros(selection);
    expect(result['background']?.id).not.toBe(5);
  });

  it('leaves unconstrained selections intact', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      dress: makeTrait(1, 'Jobs'),
      eyes: makeTrait(1, 'Happy'),
      head: makeTrait(1, 'Noogle'),
      beard: makeTrait(1, 'Austin'),
      mouth: makeTrait(1, 'Gurgaon'),
      eyewear: makeTrait(-1, null),
    };
    const result = applyConstraintsBros(selection);
    expect(result['head']?.id).toBe(1);
    expect(result['beard']?.id).toBe(1);
    expect(result['mouth']?.id).toBe(1);
  });
});

describe('applyConstraintsBaes', () => {
  it('dress 13 removes head, neck, hair, and earrings', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      eyes: makeTrait(0, 'Angry'),
      hair: makeTrait(0, 'Harley Quinn'),
      earrings: makeTrait(0, 'Leaf'),
      eyewear: makeTrait(-1, null),
      mouth: makeTrait(0, 'Smile'),
      head: makeTrait(1, 'Angel'),
      dress: makeTrait(13, 'Little Red Riding Hood'),
      neck: makeTrait(0, 'Scarf'),
    };
    const result = applyConstraintsBaes(selection);
    expect(result['head']).toBeUndefined();
    expect(result['neck']).toBeUndefined();
    expect(result['hair']).toBeUndefined();
    expect(result['earrings']).toBeUndefined();
  });

  it('dress 0 removes neck (not in allow-list)', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      eyes: makeTrait(0, 'Angry'),
      hair: makeTrait(0, 'Harley Quinn'),
      earrings: makeTrait(0, 'Leaf'),
      eyewear: makeTrait(-1, null),
      mouth: makeTrait(0, 'Smile'),
      head: makeTrait(-1, null),
      dress: makeTrait(0, 'Zo'),
      neck: makeTrait(1, 'Pearls'),
    };
    const result = applyConstraintsBaes(selection);
    expect(result['neck']).toBeUndefined();
  });

  it('dress 1 preserves neck (in allow-list)', () => {
    const selection: TraitSelection = {
      background: makeTrait(0, 'Day'),
      skin: makeTrait(0, 'Zo'),
      eyes: makeTrait(0, 'Angry'),
      hair: makeTrait(0, 'Harley Quinn'),
      earrings: makeTrait(0, 'Leaf'),
      eyewear: makeTrait(-1, null),
      mouth: makeTrait(0, 'Smile'),
      head: makeTrait(-1, null),
      dress: makeTrait(1, 'Matrix'),
      neck: makeTrait(1, 'Pearls'),
    };
    const result = applyConstraintsBaes(selection);
    expect(result['neck']?.id).toBe(1);
  });

  it('eyewear 12 + background 6 rerolls background away from 6', () => {
    const selection: TraitSelection = {
      background: makeTrait(6, 'Lego'),
      skin: makeTrait(0, 'Zo'),
      eyes: makeTrait(0, 'Angry'),
      hair: makeTrait(0, 'Harley Quinn'),
      earrings: makeTrait(0, 'Leaf'),
      eyewear: makeTrait(12, 'Love'),
      mouth: makeTrait(0, 'Smile'),
      head: makeTrait(-1, null),
      dress: makeTrait(1, 'Matrix'),
      neck: makeTrait(1, 'Pearls'),
    };
    const result = applyConstraintsBaes(selection);
    expect(result['background']?.id).not.toBe(6);
  });
});

describe('applyConstraints', () => {
  it('routes to bros constraints for bros body type', () => {
    const config: AvatarConfig = {
      bodyType: 'bros',
      traits: {
        background: 0,
        skin: 0,
        dress: 12,
        eyes: 0,
        head: 1,
        beard: 0,
        mouth: 0,
        eyewear: -1,
      },
    };
    const result = applyConstraints(config);
    expect(result.traits['head']).toBe(-1);
    expect(result.traits['beard']).toBe(-1);
  });

  it('routes to baes constraints for baes body type', () => {
    const config: AvatarConfig = {
      bodyType: 'baes',
      traits: {
        background: 0,
        skin: 0,
        eyes: 0,
        hair: 0,
        earrings: 0,
        eyewear: -1,
        mouth: 0,
        head: 1,
        dress: 13,
        neck: 0,
      },
    };
    const result = applyConstraints(config);
    expect(result.traits['head']).toBe(-1);
    expect(result.traits['neck']).toBe(-1);
    expect(result.traits['hair']).toBe(-1);
    expect(result.traits['earrings']).toBe(-1);
  });
});
