import React, { useEffect, useMemo, useState } from 'react'
import { NextPage } from 'next'
import { useAuth, useProfile } from '@zo/auth'
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
  setKitchenAudioUrl,
  unlockKitchenAudio,
} from '../../lib/cafe/kitchen-alert'
// Import the audio asset through webpack so it gets fingerprinted and bundled
// into the deploy. Files in apps/pms/public/ have historically 404'd on Vercel
// for this monorepo — see project CLAUDE.md "Vercel / Next.js asset handling".
import alertAudioUrl from '../../assets/audio/kitchen-alert.webm'

const CafeKitchenPage: NextPage = () => {
  const { propertyId, isLoading: propertyLoading } = usePropertyId()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CafeOrderWithItems | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Operator display handle for cafe_orders.accepted_by. Prefer nickname
  // ("arun.zo") because that's what diners see in the cafezomad feedback
  // modal; fall back to first name, then the auth email/phone so the field
  // is never written as an empty string.
  const actor = useMemo<string | null>(() => {
    const p = profile as { nickname?: string; first_name?: string } | undefined
    const candidate =
      p?.nickname?.trim() ||
      p?.first_name?.trim() ||
      user?.first_name?.trim() ||
      user?.email_address?.trim() ||
      user?.mobile_number?.trim() ||
      null
    return candidate || null
  }, [profile, user])

  // Accepting-orders flag — toggle at the top of the board lets the chef
  // pause new customer orders (e.g. ingredient run-out, end-of-service).
  // The flag is enforced inside place_cafe_order RPC; this UI is just the
  // staff-facing switch.
  const [acceptingOrders, setAcceptingOrders] = useState<boolean | null>(null)
  const [acceptingLoading, setAcceptingLoading] = useState(false)
  // Persist sound-ready across reloads: chefs got tired of re-clicking
  // "Enable sound" every time the kitchen tab reloaded. Browser autoplay
  // policy still requires a user gesture, but once enabled we show "ready"
  // optimistically — the first click anywhere on the page (kitchen is an
  // interactive board, so this happens within seconds) re-unlocks the
  // actual AudioContext via the listener below.
  const SOUND_PREF_KEY = 'cafe.kitchen.soundEnabled'
  const [soundReady, setSoundReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SOUND_PREF_KEY) === 'true'
  })

  // Audio setup: set the URL synchronously on mount so it survives HMR /
  // remounts, then unlock on the first user gesture (browsers block audio
  // until the page has been interacted with). After unlock, flip a
  // "Sound ready" indicator so chefs know the alert will fire.
  useEffect(() => {
    if (typeof window === 'undefined') return
    setKitchenAudioUrl(alertAudioUrl)
    if (isKitchenAudioUnlocked()) {
      setSoundReady(true)
      return
    }
    const handler = () => {
      unlockKitchenAudio()
      // unlock() resolves async (the priming play() returns a Promise),
      // so check again on a short delay to flip the "Sound ready" indicator.
      window.setTimeout(() => {
        const ok = isKitchenAudioUnlocked()
        if (ok) {
          setSoundReady(true)
          try { window.localStorage.setItem(SOUND_PREF_KEY, 'true') } catch { /* quota / private mode */ }
        }
      }, 100)
    }
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [alertAudioUrl])

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
                        setKitchenAudioUrl(alertAudioUrl)
                        unlockKitchenAudio()
                        playKitchenAlert()
                        window.setTimeout(() => {
                          const ok = isKitchenAudioUnlocked()
                          setSoundReady(ok)
                          if (ok) {
                            try { window.localStorage.setItem(SOUND_PREF_KEY, 'true') } catch { /* quota / private mode */ }
                          }
                        }, 100)
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
                actor={actor}
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
