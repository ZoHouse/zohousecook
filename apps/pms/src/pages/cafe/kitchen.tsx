import React, { useState } from 'react'
import { NextPage } from 'next'
import { Spin } from 'antd'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { KitchenBoard } from '../../components/cafe/KitchenBoard'
import { CreateOrderDialog } from '../../components/cafe/CreateOrderDialog'
import { OrderDetailModal } from '../../components/cafe/OrderDetailModal'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import type { CafeOrderWithItems, KitchenStatus } from '../../types/cafe'
import { supabase } from '../../configs/supabase'

const CafeKitchenPage: NextPage = () => {
  const { propertyId, isLoading: propertyLoading } = usePropertyId()
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CafeOrderWithItems | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleStatusChange = async (orderId: string, newStatus: KitchenStatus) => {
    await supabase
      .from('cafe_orders')
      .update({ kitchen_status: newStatus })
      .eq('id', orderId)
  }

  const headerButtons = propertyId
    ? [
        {
          label: 'New Order',
          onClick: () => setShowCreateOrder(true),
          type: 'primary' as const,
          icon: 'Plus' as const,
        },
      ]
    : []

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Kitchen" icon="Dining" buttons={headerButtons} />
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
            <KitchenBoard
              key={refreshKey}
              propertyId={propertyId}
              onViewDetail={setSelectedOrder}
            />
          )}
        </PageContent>
      </Page>

      {propertyId && (
        <CreateOrderDialog
          open={showCreateOrder}
          onClose={() => setShowCreateOrder(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
          propertyId={propertyId}
        />
      )}

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </ZoHouseGuard>
  )
}

export default CafeKitchenPage
