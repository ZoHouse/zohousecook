import React, { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Radio,
  Button,
  Space,
  Typography,
  Divider,
  message,
} from 'antd'
import { supabase } from '../../configs/supabase'
import { formatPaise } from '../../lib/cafe/order-calculator'
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
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | undefined>(undefined)
  const [selectedQty, setSelectedQty] = useState<number>(1)

  const fetchData = useCallback(async () => {
    const [catResult, itemResult, tableResult] = await Promise.all([
      supabase.from('cafe_menu_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('cafe_menu_items').select('*').eq('is_available', true).order('sort_order'),
      supabase.from('cafe_tables').select('*').eq('property_id', propertyId).eq('is_active', true).order('area').order('code'),
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
      setNotes('')
      setSelectedMenuItemId(undefined)
      setSelectedQty(1)
      form.resetFields()
    }
  }, [open, fetchData, form])

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

    setIsSubmitting(true)
    try {
      // Get next display number
      const { data: lastOrder } = await supabase
        .from('cafe_orders')
        .select('display_number')
        .eq('property_id', propertyId)
        .order('display_number', { ascending: false })
        .limit(1)
        .single()

      const displayNumber = lastOrder ? lastOrder.display_number + 1 : 1

      const itemsTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
      // 5% GST on subtotal, rounded down to nearest paise (matches place_cafe_order RPC)
      const taxAmount = Math.floor(itemsTotal * 0.05)
      const total = itemsTotal + taxAmount

      // Insert order (human_order_id is auto-populated by the trigger)
      const { data: order, error: orderError } = await supabase
        .from('cafe_orders')
        .insert({
          property_id: propertyId,
          table_id: mode === 'dine_in' ? tableId || null : null,
          mode,
          payment_mode: paymentMode,
          payment_status: paymentMode === 'cash' ? 'paid' : 'pending',
          kitchen_status: 'new',
          display_number: displayNumber,
          subtotal: itemsTotal,
          service_charge: 0,
          tax_amount: taxAmount,
          total: total,
          notes: notes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItems = cart.map((c) => ({
        order_id: order.id,
        menu_item_id: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        customizations: null,
        item_status: 'active',
      }))

      const { error: itemsError } = await supabase.from('cafe_order_items').insert(orderItems)
      if (itemsError) throw itemsError

      message.success(`Order #${displayNumber} created`)
      onCreated()
      onClose()
    } catch (err) {
      console.error('CreateOrderDialog submit error:', err)
      message.error('Failed to create order')
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
      {/* Order mode */}
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

        <Divider style={{ margin: '12px 0' }} />

        {/* Add item row */}
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

        {/* Cart */}
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
                justifyContent: 'space-between',
                fontWeight: 600,
                padding: '8px 0',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                marginBottom: 12,
              }}
            >
              <Text strong>Subtotal</Text>
              <Text strong>{formatPaise(subtotal)}</Text>
            </div>
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* Payment mode */}
        <Form.Item label="Payment Mode">
          <Radio.Group value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <Radio value="cash">Cash</Radio>
            <Radio value="razorpay">Razorpay</Radio>
            <Radio value="zo_card">Zo Card</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Notes */}
        <Form.Item label="Notes (optional)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
            style={{
              width: '100%',
              padding: '4px 11px',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
            }}
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
            Place Order{cart.length > 0 ? ` — ${formatPaise(subtotal)}` : ''}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
