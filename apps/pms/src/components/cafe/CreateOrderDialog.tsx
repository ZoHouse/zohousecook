import React, { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  message,
} from 'antd'
import { supabase } from '../../configs/supabase'
import { formatPaise } from '../../lib/cafe/order-calculator'
import { normalizePhone } from '../../lib/cafe/phone-normalize'
import type {
  MenuItem,
  MenuCategory,
  CafeTable,
  OrderMode,
  PaymentMode,
  FoodCreditWallet,
} from '../../types/cafe'

const { Text } = Typography

interface CartItem {
  menuItem: MenuItem
  quantity: number
}

interface CreateOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  propertyId: string
}

// The RPC only accepts 'cash' or 'razorpay'. When food credits fully cover
// the order, the RPC itself flips payment_mode to 'zo_card' — staff don't
// pick it explicitly.
type StaffPaymentMode = Exclude<PaymentMode, 'zo_card'>

export function CreateOrderDialog({ open, onClose, onCreated, propertyId }: CreateOrderDialogProps) {
  const [form] = Form.useForm()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<CafeTable[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [mode, setMode] = useState<OrderMode>('dine_in')
  const [paymentMode, setPaymentMode] = useState<StaffPaymentMode>('cash')
  const [tableId, setTableId] = useState<string | undefined>(undefined)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | undefined>(undefined)
  const [selectedQty, setSelectedQty] = useState<number>(1)

  // Wallet lookup state — populated when the entered phone matches a wallet.
  // The credit redeem input only appears once we know there's a balance to
  // pull from.
  const [wallet, setWallet] = useState<FoodCreditWallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [creditRupees, setCreditRupees] = useState<number>(0)

  // Menu and tables MUST be filtered by propertyId — the RPC validates that
  // every menu_item_id in the cart belongs to p_property_id, so cross-property
  // items would just bounce. Pre-filtering avoids staff confusion.
  const fetchData = useCallback(async () => {
    const [catResult, itemResult, tableResult] = await Promise.all([
      supabase
        .from('cafe_menu_categories')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('cafe_menu_items')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_available', true)
        .order('sort_order'),
      supabase
        .from('cafe_tables')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('area')
        .order('code'),
    ])
    if (catResult.data) setCategories(catResult.data)
    if (itemResult.data) setItems(itemResult.data)
    if (tableResult.data) setTables(tableResult.data)
  }, [propertyId])

  useEffect(() => {
    if (open) {
      fetchData()
      setCart([])
      setMode('dine_in')
      setPaymentMode('cash')
      setTableId(undefined)
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
      setSelectedMenuItemId(undefined)
      setSelectedQty(1)
      setWallet(null)
      setWalletError(null)
      setCreditRupees(0)
      form.resetFields()
    }
  }, [open, fetchData, form])

  // Look up the wallet when phone reaches 10 digits. Debounced so we don't
  // hit the DB on every keystroke. Resets credit when phone changes so we
  // don't end up applying credits from a previous customer's wallet.
  useEffect(() => {
    const normalized = normalizePhone(customerPhone)
    if (normalized.length !== 10) {
      setWallet(null)
      setWalletError(null)
      setCreditRupees(0)
      return
    }
    let cancelled = false
    setWalletLoading(true)
    setWalletError(null)
    const timer = setTimeout(() => {
      supabase
        .from('food_credit_wallets')
        .select('*')
        .eq('phone', normalized)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return
          if (error) {
            setWalletError(error.message)
            setWallet(null)
            setCreditRupees(0)
          } else {
            setWallet((data as FoodCreditWallet) || null)
            setCreditRupees(0)
          }
          setWalletLoading(false)
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [customerPhone])

  const addItemToCart = () => {
    if (!selectedMenuItemId) return
    const menuItem = items.find((i) => i.id === selectedMenuItemId)
    if (!menuItem) return
    const qty = selectedQty || 1
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + qty } : c
        )
      }
      return [...prev, { menuItem, quantity: qty }]
    })
    setSelectedMenuItemId(undefined)
    setSelectedQty(1)
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItem.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
  // Mirror the RPC: floor(subtotal * 0.05) so the FE preview matches what
  // the RPC will actually persist. If this drifts from the RPC body, the
  // preview will lie.
  const taxPreview = Math.floor(subtotal * 0.05)
  const grossPreview = subtotal + taxPreview
  const creditPaise = creditRupees * 100
  // Cap the credit input at min(wallet balance, gross-1-rupee). The RPC
  // accepts up to one rupee over net total, but for staff entry we just
  // cap at exact gross so we never write a negative-total order.
  const maxApplicableRupees = wallet
    ? Math.min(wallet.balance, Math.ceil(grossPreview / 100))
    : 0
  const finalPreview = Math.max(0, grossPreview - creditPaise)

  const menuItemOptions = items.map((item) => {
    const cat = categories.find((c) => c.id === item.category_id)
    return {
      value: item.id,
      label: `${item.name}${cat ? ` (${cat.name})` : ''} — ${formatPaise(item.price)}`,
    }
  })

  const tableOptions = tables.map((t) => ({
    value: t.id,
    label: `${t.area} — ${t.label || t.code}`,
  }))

  const handleSubmit = async () => {
    if (cart.length === 0) {
      message.warning('Add at least one item to the order')
      return
    }

    if (mode === 'dine_in' && !tableId) {
      message.warning('Dine-in orders need a table')
      return
    }

    if (creditRupees > 0 && !wallet) {
      message.warning('Credits selected but no wallet found for this phone')
      return
    }

    const normalizedPhone = normalizePhone(customerPhone)
    if (creditRupees > 0 && normalizedPhone.length !== 10) {
      message.warning('A 10-digit phone is required to apply credits')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('place_cafe_order', {
        p_property_id: propertyId,
        p_table_id: mode === 'dine_in' ? tableId ?? null : null,
        p_customer_name: customerName.trim() || null,
        p_customer_phone: normalizedPhone || null,
        p_zo_user_id: null,
        p_items: cart.map((c) => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
        })),
        p_food_credit_paise: creditPaise,
        p_customer_email: null,
        p_payment_mode: paymentMode,
        p_notes: notes.trim() || null,
        p_mode: mode,
      })

      if (error) {
        throw new Error(error.message.replace(/^.*RAISE EXCEPTION:\s*/, ''))
      }
      if (!data) {
        throw new Error('Order did not reach the kitchen — please try again')
      }

      const displayNumber = (data as { display_number?: number }).display_number
      message.success(displayNumber ? `Order #${displayNumber} created` : 'Order created')
      onCreated()
      onClose()
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create order'
      console.error('CreateOrderDialog submit error:', err)
      message.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="New Order"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="Order Mode">
          <Radio.Group
            value={mode}
            onChange={(e) => {
              setMode(e.target.value)
              if (e.target.value !== 'dine_in') setTableId(undefined)
            }}
          >
            <Radio value="dine_in">Dine In</Radio>
            <Radio value="pickup">Pickup</Radio>
            <Radio value="room_service">Room Service</Radio>
          </Radio.Group>
        </Form.Item>

        {mode === 'dine_in' && (
          <Form.Item label="Table" required>
            <Select
              placeholder="Select a table"
              options={tableOptions}
              value={tableId}
              onChange={setTableId}
              allowClear
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item label="Customer Name (optional)">
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Karthik"
            maxLength={80}
            allowClear
          />
        </Form.Item>

        {/* Phone is required only when redeeming credits — but it's also the
            only hook into the wallet, so we ask for it here. The wallet
            lookup runs as soon as 10 digits land. */}
        <Form.Item label="Customer Phone (required to apply $food credits)">
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="10-digit phone"
            maxLength={15}
            allowClear
          />
          {customerPhone && (
            <div style={{ marginTop: 6, fontSize: 12 }}>
              {walletLoading ? (
                <Text type="secondary">Looking up wallet…</Text>
              ) : walletError ? (
                <Text type="danger">Wallet lookup failed: {walletError}</Text>
              ) : wallet ? (
                <Tag color="green">
                  Wallet found · balance ₹{wallet.balance}
                  {wallet.name ? ` · ${wallet.name}` : ''}
                </Tag>
              ) : normalizePhone(customerPhone).length === 10 ? (
                <Text type="secondary">No $food wallet for this phone.</Text>
              ) : (
                <Text type="secondary">Enter 10 digits to look up wallet.</Text>
              )}
            </div>
          )}
        </Form.Item>

        <Divider style={{ margin: '12px 0' }} />

        <Form.Item label="Add Item">
          <Space.Compact style={{ width: '100%' }}>
            <Select
              placeholder="Search menu items..."
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={menuItemOptions}
              value={selectedMenuItemId}
              onChange={(val) => setSelectedMenuItemId(val)}
              style={{ flex: 1 }}
            />
            <InputNumber
              min={1}
              max={10}
              value={selectedQty}
              onChange={(val) => setSelectedQty(val || 1)}
              style={{ width: 70 }}
            />
            <Button
              type="primary"
              onClick={addItemToCart}
              disabled={!selectedMenuItemId}
            >
              Add
            </Button>
          </Space.Compact>
        </Form.Item>

        {cart.length > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              {cart.map((c) => (
                <div
                  key={c.menuItem.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <Text style={{ flex: 1 }}>{c.menuItem.name}</Text>
                  <Space size={4}>
                    <Button size="small" onClick={() => updateQuantity(c.menuItem.id, -1)}>-</Button>
                    <Text strong style={{ width: 24, textAlign: 'center', display: 'inline-block' }}>
                      {c.quantity}
                    </Text>
                    <Button size="small" onClick={() => updateQuantity(c.menuItem.id, 1)}>+</Button>
                  </Space>
                  <Text style={{ width: 80, textAlign: 'right' }}>
                    {formatPaise(c.menuItem.price * c.quantity)}
                  </Text>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => removeFromCart(c.menuItem.id)}
                    style={{ marginLeft: 8 }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 0',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Subtotal</Text>
                <Text>{formatPaise(subtotal)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Tax (5%)</Text>
                <Text>{formatPaise(taxPreview)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <Text strong>Order Total</Text>
                <Text strong>{formatPaise(grossPreview)}</Text>
              </div>
            </div>
          </>
        )}

        {/* Food-credit redeem — only renders when a wallet exists and the
            cart is non-empty. RPC caps and validates server-side, so this
            input is just a convenience preview. */}
        {wallet && cart.length > 0 && (
          <div
            style={{
              padding: '12px',
              borderRadius: 8,
              background: 'rgba(255, 165, 0, 0.06)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              marginBottom: 12,
            }}
          >
            <Form.Item
              label={`Apply $food credits (you have ₹${wallet.balance})`}
              style={{ marginBottom: 8 }}
            >
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  max={maxApplicableRupees}
                  value={creditRupees}
                  onChange={(val) => setCreditRupees(val || 0)}
                  style={{ flex: 1 }}
                  placeholder="0"
                />
                <Button onClick={() => setCreditRupees(maxApplicableRupees)}>
                  Max
                </Button>
                <Button onClick={() => setCreditRupees(0)}>
                  Clear
                </Button>
              </Space.Compact>
            </Form.Item>
            {creditRupees > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <Text type="secondary">After credits</Text>
                <Text strong>{formatPaise(finalPreview)} to pay</Text>
              </div>
            )}
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Form.Item label="Payment Mode">
          <Radio.Group value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <Radio value="cash">Cash</Radio>
            <Radio value="razorpay">Razorpay</Radio>
          </Radio.Group>
          {creditRupees > 0 && finalPreview === 0 && (
            <div style={{ marginTop: 4 }}>
              <Tag color="orange">Credits cover the full bill — payment_mode will be set to zo_card.</Tag>
            </div>
          )}
        </Form.Item>

        <Form.Item label="Notes (optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
            maxLength={300}
            allowClear
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={cart.length === 0}
          >
            Place Order{cart.length > 0 ? ` — ${formatPaise(finalPreview)}` : ''}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
