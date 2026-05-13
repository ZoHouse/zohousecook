import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { Button, message, Spin, Switch, Tag } from 'antd'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { KitchenBoard } from '../../components/cafe/KitchenBoard'
import { CreateOrderDialog } from '../../components/cafe/CreateOrderDialog'
import { OrderDetailModal } from '../../components/cafe/OrderDetailModal'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import type { CafeOrderWithItems, KitchenStatus } from '../../types/cafe'
import { supabase } from '../../configs/supabase'
import {
  isKitchenAudioUnlocked,
  playKitchenAlert,
  unlockKitchenAudio,
} from '../../lib/cafe/kitchen-alert'

const CafeKitchenPage: NextPage = () => {
  const { propertyId, isLoading: propertyLoading } = usePropertyId()
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CafeOrderWithItems | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Accepting-orders flag — toggle at the top of the board lets the chef
  // pause new customer orders (e.g. ingredient run-out, end-of-service).
  // The flag is enforced inside place_cafe_order RPC; this UI is just the
  // staff-facing switch.
  const [acceptingOrders, setAcceptingOrders] = useState<boolean | null>(null)
  const [acceptingLoading, setAcceptingLoading] = useState(false)
  const [soundReady, setSoundReady] = useState(false)

  // AudioContext starts suspended until a user gesture resumes it. Listen
  // for the first click/keydown anywhere on the kitchen page and unlock
  // audio so subsequent order beeps actually play. After unlock, surface
  // a "Sound ready" indicator so chefs know the alert will fire.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      unlockKitchenAudio()
      setSoundReady(isKitchenAudioUnlocked())
    }
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  useEffect(() => {
    if (!propertyId) {
      setAcceptingOrders(null)
      return
    }
    let cancelled = false
    supabase
      .from('cafe_properties')
      .select('accepting_orders')
      .eq('id', propertyId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setAcceptingOrders(data?.accepting_orders ?? true)
      })
    return () => { cancelled = true }
  }, [propertyId])

  const toggleAccepting = async (next: boolean) => {
    if (!propertyId) return
    setAcceptingLoading(true)
    const { error } = await supabase
      .from('cafe_properties')
      .update({ accepting_orders: next })
      .eq('id', propertyId)
    setAcceptingLoading(false)
    if (error) {
      message.error('Could not update accepting_orders: ' + error.message)
      return
    }
    setAcceptingOrders(next)
    message.success(next ? 'Now accepting orders' : 'Orders paused — customers will see "Closed" until you resume')
  }

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
            <>
              {/* Accepting-orders toggle — pauses/resumes customer ordering at /cafezomad */}
              {acceptingOrders !== null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 14px',
                    marginBottom: 12,
                    borderRadius: 8,
                    background: acceptingOrders ? 'rgba(82,196,26,0.08)' : 'rgba(255,77,79,0.10)',
                    border: `1px solid ${acceptingOrders ? 'rgba(82,196,26,0.3)' : 'rgba(255,77,79,0.4)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag color={acceptingOrders ? 'green' : 'red'} style={{ margin: 0 }}>
                      {acceptingOrders ? 'OPEN' : 'PAUSED'}
                    </Tag>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      {acceptingOrders
                        ? 'Customers can place new orders.'
                        : 'New customer orders are blocked. Existing orders are unaffected.'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        unlockKitchenAudio()
                        playKitchenAlert()
                        setSoundReady(isKitchenAudioUnlocked())
                      }}
                      title={
                        soundReady
                          ? 'Sound is unlocked — beep plays on every new order'
                          : 'Click to unlock the order beep (browser blocks audio until you interact with the page)'
                      }
                    >
                      {soundReady ? '🔔 Test sound' : '🔕 Enable sound'}
                    </Button>
                    <Switch
                      checked={acceptingOrders}
                      loading={acceptingLoading}
                      onChange={toggleAccepting}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                    />
                  </div>
                </div>
              )}
              <KitchenBoard
                key={refreshKey}
                propertyId={propertyId}
                onViewDetail={setSelectedOrder}
              />
            </>
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
