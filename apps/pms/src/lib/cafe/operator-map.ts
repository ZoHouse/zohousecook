/**
 * Maps PMS operator codes to Supabase cafe_properties UUIDs.
 *
 * Hardcoded mapping avoids RLS issues with the cafe_properties table.
 * If a new Zo House property is added, add its operator code + property UUID here.
 */

const OPERATOR_TO_PROPERTY: Record<string, string> = {
  BNGHO812: 'f8113423-fb4b-4c43-91d7-e281bdd2f81a',  // Zo House BLR (Koramangala)
  BNGS531: '19736bbd-e9d8-4de5-881c-ecd2adc1e9f9',   // WTFxZo (Whitefield)
}

export async function getPropertyId(operatorCode: string): Promise<string | null> {
  return OPERATOR_TO_PROPERTY[operatorCode] || null
}
