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
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from 'antd'
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import MenuItemForm from '../../components/cafe/MenuItemForm'
import { useCafeMenu } from '../../hooks/cafe/useCafeMenu'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { formatPaise } from '../../lib/cafe/order-calculator'
import type { MenuCategory, MenuItem } from '../../types/cafe'

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
  // Local mirror of categories for optimistic reorder. The hook is the
  // source of truth — this state just lets the UI snap to the new order
  // immediately on drop, with the silent refetch reconciling shortly after.
  const [localCategories, setLocalCategories] = useState<MenuCategory[]>([])

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
    reorderCategories,
    reorderItems,
  } = useCafeMenu({ categoryId: selectedCategoryId, propertyId })

  // Sync local items for optimistic availability toggle
  useEffect(() => { setLocalItems(items) }, [items])
  useEffect(() => { setLocalCategories(categories) }, [categories])

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
   * Open a small modal that lets the operator pick a different category for
   * the item. Submitting calls updateItem with the new category_id, which
   * already cascades across BLR + WTF (see useCafeMenu.updateItem).
   * Exposed from the per-card kebab menu next to Delete.
   */
  const handleMoveItem = (item: MenuItem) => {
    let pickedCategoryId: string = item.category_id
    Modal.confirm({
      title: `Move "${item.name}" to a different category`,
      content: (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>
            New category
          </div>
          <Select
            defaultValue={item.category_id}
            style={{ width: '100%' }}
            onChange={(v) => { pickedCategoryId = v }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            showSearch
            optionFilterProp="label"
          />
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
            Applies to both BLR and WTF — menu structure stays standardised.
          </div>
        </div>
      ),
      okText: 'Move',
      cancelText: 'Cancel',
      onOk: async () => {
        if (!pickedCategoryId || pickedCategoryId === item.category_id) return
        try {
          await updateItem(item.id, { category_id: pickedCategoryId })
          message.success('Item moved')
        } catch {
          message.error('Failed to move item')
          await refetch()
        }
      },
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
    ? localCategories.find((c) => c.id === selectedCategoryId)?.name || 'Items'
    : 'All Items'

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  // PointerSensor with an 8px activation distance — small movements count as
  // clicks, real drags only fire after the user clearly intends to drag. Same
  // setting the admin app's SortableGallery uses.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // While search is active we render only a subset of items; allowing reorder
  // in that subset would corrupt the full category order. Disable.
  const itemsSortable = !search.trim()

  const handleCategoriesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const snapshot = localCategories
    const oldIndex = snapshot.findIndex((c) => c.id === active.id)
    const newIndex = snapshot.findIndex((c) => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(snapshot, oldIndex, newIndex)
    setLocalCategories(next) // optimistic

    try {
      await reorderCategories(next.map((c) => c.name))
      message.success('Order saved', 1)
    } catch {
      setLocalCategories(snapshot) // rollback
      message.error("Couldn't save order — try again")
    }
  }

  const handleItemsDragEnd = async (event: DragEndEvent) => {
    if (!itemsSortable) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const snapshot = localItems
    const oldIndex = snapshot.findIndex((i) => i.id === active.id)
    const newIndex = snapshot.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(snapshot, oldIndex, newIndex)
    setLocalItems(next) // optimistic

    // Reorder is scoped to the selected category's canonical name. When
    // "All Items" is open we don't have a single category context, so fall
    // back to the dragged item's own category name.
    const categoryName =
      selectedCategoryName === 'All Items'
        ? localCategories.find((c) => c.id === snapshot[oldIndex].category_id)?.name
        : selectedCategoryName

    if (!categoryName) {
      setLocalItems(snapshot)
      return
    }

    try {
      await reorderItems(categoryName, next.map((i) => i.name))
      message.success('Order saved', 1)
    } catch {
      setLocalItems(snapshot) // rollback
      message.error("Couldn't save order — try again")
    }
  }

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
                {localCategories.map((cat) => (
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

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleCategoriesDragEnd}
                  >
                    <SortableContext
                      items={localCategories.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          marginBottom: 12,
                        }}
                      >
                        {localCategories.map((cat) => (
                          <SortableCategoryRow
                            key={cat.id}
                            cat={cat}
                            selected={selectedCategoryId === cat.id}
                            itemCount={getItemCount(cat.id)}
                            onSelect={setSelectedCategoryId}
                            onToggleVisibility={handleToggleCategory}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleItemsDragEnd}
                  >
                    <SortableContext
                      items={filteredItems.map((i) => i.id)}
                      strategy={rectSortingStrategy}
                    >
                      <Row gutter={[12, 12]}>
                        {filteredItems.map((item) => (
                          <Col key={item.id} xs={24} sm={12} md={8} xl={6}>
                        <SortableItemCard
                          item={item}
                          dragDisabled={!itemsSortable}
                          onOpenForm={() => {
                            setEditingItem(item)
                            setShowForm(true)
                          }}
                          onToggleAvailability={handleToggleAvailability}
                          onMoveItem={handleMoveItem}
                          onDeleteItem={handleDeleteItem}
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
                        </SortableItemCard>
                      </Col>
                        ))}
                      </Row>
                    </SortableContext>
                  </DndContext>
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
          categories={categories}
        />
      )}
    </ZoHouseGuard>
  )
}

// ─── Sortable wrappers ─────────────────────────────────────────────────────
// Both components use the same pattern: the @dnd-kit useSortable hook
// provides setNodeRef + transform/transition for the wrapper, and a small
// grip-icon child carries the {...attributes} {...listeners} so ONLY that
// handle starts a drag. Clicking the rest of the row/card behaves normally
// — selecting a category, opening the edit form, toggling availability,
// etc. — because no DnD listeners are bound to those elements.

interface SortableCategoryRowProps {
  cat: MenuCategory
  selected: boolean
  itemCount: number
  onSelect: (id: string) => void
  onToggleVisibility: (id: string, nextActive: boolean) => Promise<void> | void
}

function SortableCategoryRow({
  cat,
  selected,
  itemCount,
  onSelect,
  onToggleVisibility,
}: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : undefined,
    background: isDragging ? 'rgba(255,255,255,0.04)' : undefined,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <span
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          color: '#8c8c8c',
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
          touchAction: 'none',
        }}
      >
        <HolderOutlined />
      </span>
      <Button
        block
        type={selected ? 'primary' : 'default'}
        onClick={() => onSelect(cat.id)}
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
          count={itemCount}
          style={{ marginLeft: 8, backgroundColor: '#8c8c8c' }}
          overflowCount={999}
        />
      </Button>
      <Tooltip title={cat.is_active ? 'Hide category' : 'Show category'}>
        <Button
          size="small"
          type="text"
          icon={cat.is_active ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => onToggleVisibility(cat.id, !cat.is_active)}
          style={{ color: cat.is_active ? '#8c8c8c' : '#ef4444', flexShrink: 0 }}
        />
      </Tooltip>
    </div>
  )
}

interface SortableItemCardProps {
  item: MenuItem
  dragDisabled: boolean
  onOpenForm: () => void
  onToggleAvailability: (id: string, available: boolean) => void
  onMoveItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
  children: React.ReactNode
}

function SortableItemCard({
  item,
  dragDisabled,
  onOpenForm,
  onToggleAvailability,
  onMoveItem,
  onDeleteItem,
  children,
}: SortableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: dragDisabled,
  })
  const wrapStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={wrapStyle}>
      {/* Grip handle — top-left corner of the cover area, on top of the
          image. stopPropagation on click prevents a non-drag click from
          opening the edit form behind it. */}
      {!dragDisabled && (
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 5,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            borderRadius: 4,
            padding: '2px 4px',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            touchAction: 'none',
          }}
        >
          <HolderOutlined />
        </div>
      )}
      <Card
        hoverable
        style={{ opacity: item.is_available ? 1 : 0.65 }}
        bodyStyle={{ padding: 12 }}
        onClick={onOpenForm}
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
              onChange={(checked) => onToggleAvailability(item.id, checked)}
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
                    key: 'move',
                    label: 'Move to category…',
                    icon: <SwapOutlined />,
                    onClick: ({ domEvent }) => {
                      domEvent.stopPropagation()
                      onMoveItem(item)
                    },
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    label: 'Delete item',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: ({ domEvent }) => {
                      domEvent.stopPropagation()
                      onDeleteItem(item)
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
        {children}
      </Card>
    </div>
  )
}

export default CafeMenuPage
