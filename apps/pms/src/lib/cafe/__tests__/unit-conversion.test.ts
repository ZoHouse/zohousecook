import { convertUnit } from '../unit-conversion'

describe('convertUnit', () => {
  it('returns the amount unchanged when units are identical', () => {
    expect(convertUnit(100, 'g', 'g')).toBe(100)
    expect(convertUnit(2, 'pieces', 'pieces')).toBe(2)
  })

  it('converts grams to kilograms', () => {
    expect(convertUnit(1000, 'g', 'kg')).toBe(1)
    expect(convertUnit(250, 'g', 'kg')).toBe(0.25)
  })

  it('converts kilograms to grams', () => {
    expect(convertUnit(1, 'kg', 'g')).toBe(1000)
  })

  it('converts milliliters to liters', () => {
    expect(convertUnit(500, 'ml', 'liter')).toBe(0.5)
  })

  it('converts tsp/tbsp/cups to ml-based units', () => {
    expect(convertUnit(1, 'tsp', 'ml')).toBe(5)
    expect(convertUnit(1, 'tbsp', 'ml')).toBe(15)
    expect(convertUnit(1, 'cups', 'ml')).toBe(240)
  })

  it('treats pieces and slice as interchangeable countables', () => {
    expect(convertUnit(2, 'pieces', 'slice')).toBe(2)
    expect(convertUnit(3, 'slice', 'pieces')).toBe(3)
  })

  it('returns null when units are incompatible (weight ↔ countable)', () => {
    expect(convertUnit(100, 'g', 'pieces')).toBeNull()
    expect(convertUnit(1, 'pieces', 'kg')).toBeNull()
  })

  it('returns null when units are incompatible (weight ↔ volume)', () => {
    expect(convertUnit(100, 'g', 'ml')).toBeNull()
  })
})
