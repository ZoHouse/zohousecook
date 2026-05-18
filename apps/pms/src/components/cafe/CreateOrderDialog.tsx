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
import type { MenuItem, MenuCategory, CafeTable, OrderMode, PaymentMode } from '../../types/cafe'

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

export function CreateOrderDialog({ open, onClose, onCreated, propertyId }: CreateOrderDialogProps) {
  const [form] = Form.useForm()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<CafeTable[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [mode, setMode] = useState<OrderMode>('dine_in')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [tableId, setTableId] = useState<string | undefined>(undefined)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | undefined>(undefined)
  const [selectedQty, setSelectedQty] = useState<number>(1)

  // Food-credit wallet for the entered phone. Looked up live as staff types.
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [foodCreditRupees, setFoodCreditRupees] = useState<number>(0)

  const fetchData = useCallback(async () => {
    // Filter menu by propertyId so BLR staff don't accidentally pick a WTF
    // menu_item_id (which place_cafe_order would reject anyway, but better
    // to surface it in the UI). Categories filtered by property too.
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
      setWalletBalance(null)
      setFoodCreditRupees(0)
      form.resetFields()
    }
  }, [open, fetchData, form])

  // Look up wallet when phone reaches 10 digits.
  useEffect(() => {
    const normalized = normalizePhone(customerPhone)
    if (normalized.length !== 10) {
      setWalletBalance(null)
      setFoodCreditRupees(0)
      return
    }
    let cancelled = false
    setWalletLoading(true)
    supabase
      .from('food_credit_wallets')
      .select('balance')
      .eq('phone', normalized)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setWalletBalance(data?.balance ?? null)
        setWalletLoading(false)
      })
    return () => {
      cancelled = true
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
  // Match place_cafe_order RPC's tax math (floor of 5% on subtotal).
  const taxAmount = Math.floor(subtotal * 0.05)
  const netTotal = subtotal + taxAmount
  // Cap food-credit application at min(balance, ceil(net/100)) — RPC accepts
  // up to one rupee over to absorb the paise tail.
  const maxApplicable = walletBalance != null
    ? Math.min(walletBalance, Math.ceil(netTotal / 100))
    : 0
  const appliedPaise = Math.min(foodCreditRupees, maxApplicable) * 100
  const finalDue = Math.max(0, netTotal - appliedPaise)

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

    const normalizedPhone = normalizePhone(customerPhone)
    if (paymentMode === 'zo_card' && normalizedPhone.length !== 10) {
      message.warning('Zo Card payment needs a 10-digit customer phone')
      return
    }
    if (appliedPaise > 0 && normalizedPhone.length !== 10) {
      message.warning('Food credits need a 10-digit customer phone')
      return
    }

    // When the staff picks Zo Card, the order MUST be fully covered by food
    // credits — otherwise the RPC would mark it as a draft/razorpay order
    // with no money in hand. Make staff resolve the gap explicitly.
    if (paymentMode === 'zo_card' && appliedPaise < netTotal) {
      message.warning('Zo Card needs credits to cover the full order')
      return
    }

    setIsSubmitting(true)
    try {
      // Funnel through place_cafe_order. The RPC enforces accepting_orders,
      // assigns display_number atomically, validates prices server-side,
      // checks wallet balance, debits credits in the same transaction, and
      // sets payment_mode/payment_status/kitchen_status consistently. Direct
      // inserts (the previous behaviour) bypassed every one of these.
      const { data, error } = await supabase.rpc('place_cafe_order', {
        p_property_id: propertyId,
        p_table_id: mode === 'dine_in' ? tableId || null : null,
        p_customer_name: customerName.trim() || null,
        p_customer_phone: normalizedPhone.length === 10 ? normalizedPhone : null,
        p_customer_email: null,
        p_zo_user_id: null,
        p_items: cart.map((c) => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
        })),
        p_food_credit_paise: appliedPaise,
        p_payment_mode: paymentMode === 'zo_card' ? 'cash' : paymentMode,
        p_notes: notes.trim() || null,
        p_mode: mode,
      })

      if (error) throw new Error(error.message.replace(/^.*RAISE EXCEPTION:\s*/, ''))

      message.success(`Order #${data?.display_number ?? ''} created`)
      onCreated()
      onClose()
    } catch (err) {
      console.error('CreateOrderDialog submit error:', err)
      message.error(err instanceof Error ? err.message : 'Failed to create order')
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
          <Form.Item label="Table">
            <Select
              placeholder="Select a table (optional)"
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

        <Form.Item
          label={
            <Space size={6}>
              <span>Customer Phone</span>
              {walletBalance != null && (
                <Tag color="green">
                  $food balance ₹{walletBalance}
                </Tag>
              )}
              {walletLoading && <Tag>looking up…</Tag>}
            </Space>
          }
        >
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="10-digit mobile (required for Zo Card / credits)"
            maxLength={15}
            allowClear
          />
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
              max={99}
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
                padding: '8px 0',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Subtotal</Text>
                <Text>{formatPaise(subtotal)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>GST (5%)</Text>
                <Text>{formatPaise(taxAmount)}</Text>
              </div>
              {appliedPaise > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                  <Text style={{ color: 'inherit' }}>$food applied</Text>
                  <Text style={{ color: 'inherit' }}>− {formatPaise(appliedPaise)}</Text>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: '1px dashed rgba(0,0,0,0.15)',
                }}
              >
                <Text strong>Due</Text>
                <Text strong>{formatPaise(finalDue)}</Text>
              </div>
            </div>
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Form.Item label="Payment Mode">
          <Radio.Group value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <Radio value="cash">Cash</Radio>
            <Radio value="razorpay">Razorpay</Radio>
            <Radio value="zo_card" disabled={walletBalance == null}>
              Zo Card{walletBalance != null ? '' : ' (enter phone first)'}
            </Radio>
          </Radio.Group>
        </Form.Item>

        {walletBalance != null && walletBalance > 0 && (
          <Form.Item label={`Apply $food (max ₹${maxApplicable})`}>
            <InputNumber
              min={0}
              max={maxApplicable}
              value={foodCreditRupees}
              onChange={(val) => setFoodCreditRupees(typeof val === 'number' ? val : 0)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item label="Notes (optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
            maxLength={200}
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
            Place Order{cart.length > 0 ? ` — ${formatPaise(finalDue)}` : ''}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
