import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import {
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from 'antd'
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import MenuItemForm from '../../components/cafe/MenuItemForm'
import { useCafeMenu } from '../../hooks/cafe/useCafeMenu'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { formatPaise } from '../../lib/cafe/order-calculator'
import type { MenuItem } from '../../types/cafe'

const DIET_COLORS: Record<string, string> = {
  veg: '#22c55e',
  egg: '#eab308',
  non_veg: '#ef4444',
}

const CafeMenuPage: NextPage = () => {
  const { propertyId } = usePropertyId()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [localItems, setLocalItems] = useState<MenuItem[]>([])

  const {
    categories,
    items,
    isLoading,
    refetch,
    createCategory,
    toggleCategory,
    createItem,
    updateItem,
    toggleAvailability,
    deleteItem,
  } = useCafeMenu({ categoryId: selectedCategoryId, propertyId })

  // Sync local items for optimistic availability toggle
  useEffect(() => { setLocalItems(items) }, [items])

  // --- Category actions ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      await createCategory(newCategoryName.trim())
      message.success('Category added')
      setNewCategoryName('')
      setAddCategoryModalOpen(false)
    } catch {
      message.error('Failed to add category')
    }
  }

  const handleToggleCategory = async (id: string, isActive: boolean) => {
    try {
      await toggleCategory(id, isActive)
    } catch {
      message.error('Failed to update category')
    }
  }

  // --- Item actions ---
  const handleSubmitItem = async (data: Record<string, unknown>): Promise<string | null> => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data)
        message.success('Item updated')
        setShowForm(false)
        setEditingItem(null)
        return editingItem.id
      } else {
        const newId = await createItem(data)
        message.success('Item added')
        setShowForm(false)
        setEditingItem(null)
        return newId
      }
    } catch {
      message.error(editingItem ? 'Failed to update item' : 'Failed to add item')
      return null
    }
  }

  const handleToggleAvailability = (id: string, available: boolean) => {
    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_available: available } : item))
    )
    toggleAvailability(id, available).catch(() => {
      // Revert on failure
      setLocalItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_available: !available } : item))
      )
      message.error('Failed to update availability')
    })
  }

  /**
   * Confirm + soft-delete a menu item. Used from both the per-card kebab
   * menu and the in-form Delete button. Operates across all properties
   * (matches the standardised-menu pattern of createItem / updateItem).
   */
  const handleDeleteItem = (item: MenuItem, opts?: { onSuccess?: () => void }) => {
    Modal.confirm({
      title: `Delete "${item.name}"?`,
      content:
        "The item will be removed from the menu for all properties. Existing order history is preserved.",
      okText: 'Yes, delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Optimistic removal — pull from local list immediately.
          setLocalItems((prev) => prev.filter((i) => i.id !== item.id))
          await deleteItem(item.id)
          message.success('Item deleted')
          opts?.onSuccess?.()
        } catch {
          message.error('Failed to delete item')
          // Refetch to restore correct state on failure.
          await refetch()
        }
      },
    })
  }

  // --- Filtering ---
  const filteredItems = search.trim()
    ? localItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : localItems

  const getItemCount = (categoryId: string) =>
    items.filter((item) => item.category_id === categoryId).length

  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.name || 'Items'
    : 'All Items'

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Menu Management" icon="Food" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Mobile category chips — horizontal scroll */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  paddingBottom: 12,
                  marginBottom: 4,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <Button
                  size="small"
                  type={!selectedCategoryId ? 'primary' : 'default'}
                  onClick={() => setSelectedCategoryId(null)}
                  style={{ flexShrink: 0 }}
                >
                  All ({items.length})
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="small"
                    type={selectedCategoryId === cat.id ? 'primary' : 'default'}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{
                      flexShrink: 0,
                      opacity: cat.is_active ? 1 : 0.5,
                    }}
                  >
                    {cat.name} ({getItemCount(cat.id)})
                  </Button>
                ))}
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setAddCategoryModalOpen(true)}
                  style={{ flexShrink: 0 }}
                />
              </div>

            <Row gutter={[16, 16]}>
              {/* Left sidebar — categories (desktop only) */}
              <Col xs={0} lg={5}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Button
                      block
                      type={!selectedCategoryId ? 'primary' : 'default'}
                      onClick={() => setSelectedCategoryId(null)}
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      All Items
                      <Badge
                        count={items.length}
                        style={{ marginLeft: 8, backgroundColor: '#8c8c8c' }}
                        overflowCount={999}
                      />
                    </Button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Button
                          block
                          type={selectedCategoryId === cat.id ? 'primary' : 'default'}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          style={{
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            flex: 1,
                            opacity: cat.is_active ? 1 : 0.5,
                            textDecoration: cat.is_active ? 'none' : 'line-through',
                          }}
                        >
                          {cat.name}
                          <Badge
                            count={getItemCount(cat.id)}
                            style={{ marginLeft: 8, backgroundColor: '#8c8c8c' }}
                            overflowCount={999}
                          />
                        </Button>
                        <Tooltip title={cat.is_active ? 'Hide category' : 'Show category'}>
                          <Button
                            size="small"
                            type="text"
                            icon={cat.is_active ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            onClick={() => handleToggleCategory(cat.id, !cat.is_active)}
                            style={{ color: cat.is_active ? '#8c8c8c' : '#ef4444', flexShrink: 0 }}
                          />
                        </Tooltip>
                      </div>
                    ))}
                  </div>

                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    block
                    onClick={() => setAddCategoryModalOpen(true)}
                  >
                    Add Category
                  </Button>
                </div>
              </Col>

              {/* Right — items grid */}
              <Col xs={24} lg={19}>
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {selectedCategoryName}
                    {localItems.length > 0 && (
                      <span style={{ fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>
                        ({filteredItems.length}
                        {filteredItems.length !== localItems.length
                          ? `/${localItems.length}`
                          : ''}
                        )
                      </span>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input
                      prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="Search items..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: 180, minWidth: 120 }}
                      allowClear
                    />
                    {selectedCategoryId && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingItem(null)
                          setShowForm(true)
                        }}
                      >
                        Add Item
                      </Button>
                    )}
                  </div>
                </div>

                {/* Items grid */}
                {filteredItems.length === 0 ? (
                  <Empty
                    description={
                      search.trim()
                        ? `No items matching "${search}"`
                        : selectedCategoryId
                        ? 'No items in this category'
                        : 'Select a category to view items'
                    }
                    style={{ marginTop: 40 }}
                  />
                ) : (
                  <Row gutter={[12, 12]}>
                    {filteredItems.map((item) => (
                      <Col key={item.id} xs={24} sm={12} md={8} xl={6}>
                        <Card
                          hoverable
                          style={{ opacity: item.is_available ? 1 : 0.65 }}
                          bodyStyle={{ padding: 12 }}
                          onClick={() => {
                            setEditingItem(item)
                            setShowForm(true)
                          }}
                          cover={
                            item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                style={{
                                  height: 96,
                                  objectFit: 'cover',
                                  borderRadius: '8px 8px 0 0',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  height: 96,
                                  background: '#f5f5f5',
                                  borderRadius: '8px 8px 0 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 28,
                                  color: '#bfbfbf',
                                }}
                              >
                                🍽
                              </div>
                            )
                          }
                          actions={[
                            <div
                              key="availability"
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                              <Switch
                                size="small"
                                checked={item.is_available}
                                onChange={(checked) =>
                                  handleToggleAvailability(item.id, checked)
                                }
                              />
                              <span style={{ fontSize: 12, color: item.is_available ? '#22c55e' : '#ef4444' }}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>,
                            <div
                              key="more"
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Dropdown
                                trigger={['click']}
                                placement="bottomRight"
                                menu={{
                                  items: [
                                    {
                                      key: 'delete',
                                      label: 'Delete item',
                                      icon: <DeleteOutlined />,
                                      danger: true,
                                      onClick: ({ domEvent }) => {
                                        domEvent.stopPropagation()
                                        handleDeleteItem(item)
                                      },
                                    },
                                  ],
                                }}
                              >
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<MoreOutlined />}
                                  aria-label="More options"
                                />
                              </Dropdown>
                            </div>,
                          ]}
                        >
                          {/* Name + diet dot */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  backgroundColor: DIET_COLORS[item.diet] || '#8c8c8c',
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  textDecoration: item.is_available ? 'none' : 'line-through',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.name}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                flexShrink: 0,
                                color: 'rgba(255,255,255,0.85)',
                              }}
                            >
                              {formatPaise(item.price)}
                            </span>
                          </div>

                          {/* Calories */}
                          {item.calories != null && (
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                              {item.calories} kcal
                              {item.protein != null && ` · P ${item.protein}g`}
                              {item.carbs != null && ` · C ${item.carbs}g`}
                            </div>
                          )}

                          {/* Badges */}
                          {item.daily_limit != null && (
                            <div style={{ marginTop: 2 }}>
                              <Tag color="orange" style={{ fontSize: 10 }}>
                                Limit: {item.daily_limit}/day
                              </Tag>
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Col>
            </Row>
            </>
          )}
        </PageContent>
      </Page>

      {/* Add Category Modal */}
      <Modal
        open={addCategoryModalOpen}
        title="Add Category"
        okText="Add"
        cancelText="Cancel"
        onOk={handleAddCategory}
        onCancel={() => {
          setAddCategoryModalOpen(false)
          setNewCategoryName('')
        }}
        destroyOnClose
      >
        <Input
          placeholder="Category name (e.g. Mains, Beverages)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={handleAddCategory}
          autoFocus
        />
      </Modal>

      {/* Add / Edit Item Modal */}
      {showForm && (selectedCategoryId || editingItem) && (
        <MenuItemForm
          open={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
          onSubmit={handleSubmitItem}
          onDelete={(item) =>
            handleDeleteItem(item, {
              onSuccess: () => {
                setShowForm(false)
                setEditingItem(null)
              },
            })
          }
          editItem={editingItem}
          categoryId={
            selectedCategoryId || editingItem?.category_id || ''
          }
        />
      )}
    </ZoHouseGuard>
  )
}

export default CafeMenuPage
