import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { NextPage } from 'next'
import {
  Button,
  Input,
  InputNumber,
  message,
  Pagination,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import IngredientForm from '../../components/cafe/IngredientForm'
import { useIngredients } from '../../hooks/cafe/useIngredients'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { supabase } from '../../configs/supabase'
import { formatPaise } from '../../lib/cafe/order-calculator'
import type { CafeIngredient, CafeIngredientWithStock, IngredientStockWithProperty, IngredientUnit, UpdateStockRequest } from '../../types/cafe'

const { Text } = Typography

const CATEGORIES = [
  'All',
  'Dairy', 'Fruits', 'Grains', 'Herbs & Spices', 'Meat', 'Oils & Fats',
  'Pantry', 'Produce', 'Proteins', 'Sauces', 'Seafood', 'Sweeteners',
  'Vegetables', 'Beverages', 'Bakery', 'Other',
]

const PAGE_SIZE = 50

interface LowStockAlert {
  ingredient: CafeIngredientWithStock
  stock: IngredientStockWithProperty
}

// Inline stock edit cell
function StockCell({
  stock,
  ingredientId,
  onSave,
}: {
  stock: IngredientStockWithProperty | undefined
  ingredientId: string
  onSave: (ingredientId: string, data: UpdateStockRequest) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<number | null>(null)

  const currentStock = stock?.current_stock ?? 0
  const minStock = stock?.min_stock ?? null
  const isLow = minStock !== null && currentStock <= minStock
  const isEmpty = currentStock === 0

  const handleSave = async () => {
    if (value !== null && value >= 0 && stock) {
      try {
        await onSave(ingredientId, {
          property_id: stock.property_id,
          current_stock: value,
          min_stock: minStock,
        })
      } catch {
        message.error('Failed to update stock')
      }
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <InputNumber
        size="small"
        min={0}
        step={0.1}
        value={value}
        onChange={setValue}
        onBlur={handleSave}
        onPressEnter={handleSave}
        autoFocus
        style={{ width: 80 }}
      />
    )
  }

  const color = isEmpty ? '#ef4444' : isLow ? '#d97706' : undefined

  return (
    <Tooltip title={`Min: ${minStock ?? 'not set'}. Click to edit.`}>
      <span
        style={{
          cursor: 'pointer',
          color,
          fontWeight: (isEmpty || isLow) ? 600 : undefined,
          fontFamily: 'monospace',
          padding: '2px 6px',
          borderRadius: 4,
          background: isEmpty ? '#fef2f2' : isLow ? '#fffbeb' : undefined,
        }}
        onClick={() => {
          setValue(currentStock)
          setEditing(true)
        }}
      >
        {currentStock}
      </span>
    </Tooltip>
  )
}

const CafeInventoryPage: NextPage = () => {
  const { propertyId } = usePropertyId()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [category, setCategory] = useState('All')
  const [outlet, setOutlet] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<CafeIngredient | null>(null)

  // Separate state for low-stock alerts (fetches all ingredients)
  const [allIngredients, setAllIngredients] = useState<CafeIngredientWithStock[]>([])

  const { ingredients, totalCount, isLoading, createIngredient, updateIngredient, updateStock } = useIngredients({
    category: category !== 'All' ? category : undefined,
    search: debouncedSearch || undefined,
    propertyCode: outlet !== 'all' ? outlet : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  // Search debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
    setDebounceTimer(timer)
  }, [debounceTimer])

  // Fetch all for low-stock alerts
  useEffect(() => {
    supabase
      .from('cafe_ingredients')
      .select('*, stock:cafe_ingredient_stock(*, property:cafe_properties(code))')
      .eq('is_active', true)
      .limit(500)
      .then(({ data }) => {
        if (!data) return
        const mapped: CafeIngredientWithStock[] = data.map((ing: Record<string, unknown>) => ({
          ...(ing as unknown as CafeIngredient),
          stock: ((ing.stock as Record<string, unknown>[]) || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            ingredient_id: s.ingredient_id as string,
            property_id: s.property_id as string,
            current_stock: s.current_stock as number,
            min_stock: s.min_stock as number | null,
            updated_at: s.updated_at as string,
            property_code: ((s.property as Record<string, unknown>)?.code as string) || '',
          })),
        }))
        setAllIngredients(mapped)
      })
  }, [ingredients])

  const lowStockAlerts = useMemo<LowStockAlert[]>(() => {
    const alerts: LowStockAlert[] = []
    for (const ing of allIngredients) {
      for (const s of ing.stock) {
        if (s.min_stock !== null && s.current_stock <= s.min_stock) {
          alerts.push({ ingredient: ing, stock: s })
        }
      }
    }
    alerts.sort((a, b) => {
      if (a.stock.current_stock === 0 && b.stock.current_stock !== 0) return -1
      if (b.stock.current_stock === 0 && a.stock.current_stock !== 0) return 1
      const ratioA = a.stock.min_stock ? a.stock.current_stock / a.stock.min_stock : 0
      const ratioB = b.stock.min_stock ? b.stock.current_stock / b.stock.min_stock : 0
      return ratioA - ratioB
    })
    return alerts
  }, [allIngredients])

  const outOfStockCount = lowStockAlerts.filter((a) => a.stock.current_stock === 0).length

  const handleCreateIngredient = async (data: {
    name: string
    category: string
    unit: IngredientUnit
    unit_cost_paise: number | null
    supplier: string | null
    is_active?: boolean
  }) => {
    try {
      await createIngredient({
        name: data.name,
        category: data.category,
        unit: data.unit,
        unit_cost_paise: data.unit_cost_paise,
        supplier: data.supplier,
      })
      message.success('Ingredient added')
      setFormOpen(false)
    } catch {
      message.error('Failed to add ingredient')
    }
  }

  const handleUpdateIngredient = async (data: {
    name: string
    category: string
    unit: IngredientUnit
    unit_cost_paise: number | null
    supplier: string | null
    is_active?: boolean
  }) => {
    if (!editingIngredient) return
    try {
      await updateIngredient(editingIngredient.id, {
        name: data.name,
        category: data.category,
        unit: data.unit,
        unit_cost_paise: data.unit_cost_paise,
        supplier: data.supplier,
        is_active: data.is_active,
      })
      message.success('Ingredient updated')
      setEditingIngredient(null)
    } catch {
      message.error('Failed to update ingredient')
    }
  }

  const showAll = outlet === 'all'

  const columns: TableColumnsType<CafeIngredientWithStock> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
    },
    {
      title: 'Cost',
      dataIndex: 'unit_cost_paise',
      key: 'cost',
      width: 80,
      align: 'right',
      render: (v: number | null) => v != null ? formatPaise(v) : '—',
    },
    // BLR stock column
    ...(showAll || outlet === 'blr' ? [{
      title: 'BLR Stock',
      key: 'blr_stock',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: CafeIngredientWithStock) => {
        const s = record.stock.find((x) => x.property_code.toLowerCase() === 'blr')
        return <StockCell stock={s} ingredientId={record.id} onSave={updateStock} />
      },
    }] : []),
    // WTF stock column
    ...(showAll || outlet === 'wtf' ? [{
      title: 'WTF Stock',
      key: 'wtf_stock',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: CafeIngredientWithStock) => {
        const s = record.stock.find((x) => x.property_code.toLowerCase() === 'wtf')
        return <StockCell stock={s} ingredientId={record.id} onSave={updateStock} />
      },
    }] : []),
    {
      title: 'Min Stock',
      key: 'min_stock',
      width: 90,
      align: 'right',
      render: (_: unknown, record: CafeIngredientWithStock) => {
        const minStock = record.stock.length > 0
          ? record.stock[0]?.min_stock ?? null
          : null
        return <Text type="secondary">{minStock ?? '—'}</Text>
      },
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 140,
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'right',
      render: (_: unknown, record: CafeIngredientWithStock) => (
        <Button
          size="small"
          onClick={() => setEditingIngredient(record as unknown as CafeIngredient)}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Inventory" icon="NoteBook" />
        <PageContent>
          {/* Outlet + Add button row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Segmented
              value={outlet}
              onChange={(v) => { setOutlet(v as string); setPage(1) }}
              options={[
                { label: 'All', value: 'all' },
                { label: 'BLR', value: 'blr' },
                { label: 'WTF', value: 'wtf' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingIngredient(null); setFormOpen(true) }}
            >
              Add Ingredient
            </Button>
          </div>

          {/* Search + category filters */}
          <div style={{ marginBottom: 16 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search ingredients..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              style={{ width: 260, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map((cat) => (
                <Tag
                  key={cat}
                  color={category === cat ? 'orange' : 'default'}
                  onClick={() => { setCategory(cat); setPage(1) }}
                  style={{ cursor: 'pointer', marginBottom: 0 }}
                >
                  {cat}
                </Tag>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStockAlerts.length > 0 && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <Space style={{ marginBottom: 6 }}>
                <WarningOutlined style={{ color: '#d97706' }} />
                <Text strong style={{ color: '#b45309', fontSize: 13 }}>
                  {lowStockAlerts.length} item{lowStockAlerts.length !== 1 ? 's' : ''} need restock
                </Text>
                {outOfStockCount > 0 && (
                  <Tag color="red">{outOfStockCount} out of stock</Tag>
                )}
              </Space>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lowStockAlerts.slice(0, 12).map((alert) => {
                  const isEmpty = alert.stock.current_stock === 0
                  return (
                    <Tag
                      key={`${alert.ingredient.id}-${alert.stock.property_code}`}
                      color={isEmpty ? 'red' : 'orange'}
                      style={{ fontSize: 11 }}
                    >
                      {alert.ingredient.name} {alert.stock.property_code.toUpperCase()} ({alert.stock.current_stock}/{alert.stock.min_stock})
                    </Tag>
                  )
                })}
                {lowStockAlerts.length > 12 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>+{lowStockAlerts.length - 12} more</Text>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <Table<CafeIngredientWithStock>
            dataSource={ingredients}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="small"
            scroll={{ x: 700 }}
            locale={{ emptyText: isLoading ? <Spin /> : 'No ingredients found' }}
          />

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={totalCount}
                onChange={(p) => setPage(p)}
                showTotal={(total) => `${total} ingredients`}
                showSizeChanger={false}
              />
            </div>
          )}
        </PageContent>
      </Page>

      {/* Add / Edit form */}
      <IngredientForm
        open={formOpen || !!editingIngredient}
        onClose={() => { setFormOpen(false); setEditingIngredient(null) }}
        onSubmit={editingIngredient ? handleUpdateIngredient : handleCreateIngredient}
        editIngredient={editingIngredient}
      />
    </ZoHouseGuard>
  )
}

export default CafeInventoryPage
