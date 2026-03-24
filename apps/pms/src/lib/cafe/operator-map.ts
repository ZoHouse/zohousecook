import { supabase } from '../../configs/supabase'

const operatorPropertyCache: Record<string, string> = {}

const CODE_MAP: Record<string, string> = {
  BNGHO812: 'BLR',
  BNGS531: 'WTF',
}

export async function getPropertyId(operatorCode: string): Promise<string | null> {
  if (operatorPropertyCache[operatorCode]) {
    return operatorPropertyCache[operatorCode]
  }
  const propertyCode = CODE_MAP[operatorCode]
  if (!propertyCode) return null

  const { data } = await supabase
    .from('cafe_properties')
    .select('id')
    .eq('code', propertyCode)
    .single()

  if (data?.id) {
    operatorPropertyCache[operatorCode] = data.id
  }
  return data?.id || null
}
