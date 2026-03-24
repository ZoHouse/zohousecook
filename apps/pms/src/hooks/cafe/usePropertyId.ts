import { useEffect, useState } from 'react'
import useAssociation from '../useAssociation'
import { getPropertyId } from '../../lib/cafe/operator-map'

export function usePropertyId() {
  const { selectedOperator } = useAssociation()
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const code = selectedOperator?.code
    if (!code) {
      setPropertyId(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getPropertyId(code).then((id) => {
      setPropertyId(id)
      setIsLoading(false)
    })
  }, [selectedOperator?.code])

  return { propertyId, isLoading, operatorCode: selectedOperator?.code }
}
