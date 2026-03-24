import React from 'react'
import { NextPage } from 'next'
import { Spin } from 'antd'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { KitchenBoard } from '../../components/cafe/KitchenBoard'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'

const CafeKitchenPage: NextPage = () => {
  const { propertyId, isLoading: propertyLoading } = usePropertyId()

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Kitchen" icon="Dining" />
        <PageContent>
          {propertyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : !propertyId ? (
            <div
              style={{
                textAlign: 'center',
                padding: 60,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Select a property to view the kitchen board.
            </div>
          ) : (
            <KitchenBoard propertyId={propertyId} />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default CafeKitchenPage
