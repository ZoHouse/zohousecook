import React, { useEffect, useState, useCallback } from 'react'
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Switch,
  Upload,
  message,
} from 'antd'
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { MenuItem, IngredientUnit } from '../../types/cafe'
import { supabase } from '../../configs/supabase'

const RECIPE_UNITS: IngredientUnit[] = ['g', 'kg', 'ml', 'liter', 'pieces', 'tsp', 'tbsp', 'cups', 'slice']

interface RecipeRow {
  id?: string // existing DB row id, undefined for new rows
  ingredient_id: string
  ingredient_name: string
  quantity: number
  unit: IngredientUnit
}

interface IngredientOption {
  id: string
  name: string
  unit: IngredientUnit
  category: string
}

interface MenuItemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<string | null> | void
  /** Called when the user clicks Delete (only visible in edit mode). Form handles its own confirmation in the parent. */
  onDelete?: (item: MenuItem) => void
  editItem?: MenuItem | null
  categoryId: string
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  editItem,
  categoryId,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editItem
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [aiFilling, setAiFilling] = useState(false)

  // Recipe state
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([])
  const [allIngredients, setAllIngredients] = useState<IngredientOption[]>([])
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [recipeSaving, setRecipeSaving] = useState(false)
  const [originalRecipeIds, setOriginalRecipeIds] = useState<Set<string>>(new Set())

  // Fetch all ingredients (for the dropdown)
  useEffect(() => {
    if (!open) return
    supabase
      .from('cafe_ingredients')
      .select('id, name, unit, category')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setAllIngredients(data as IngredientOption[])
      })
  }, [open])

  // Fetch existing recipe rows when editing
  useEffect(() => {
    if (!open || !editItem?.id) {
      setRecipeRows([])
      setOriginalRecipeIds(new Set())
      return
    }
    setRecipeLoading(true)
    supabase
      .from('cafe_recipe_items')
      .select('id, ingredient_id, quantity, unit, ingredient:cafe_ingredients(name)')
      .eq('menu_item_id', editItem.id)
      .then(({ data }) => {
        const rows: RecipeRow[] = (data || []).map((r) => {
          const ing = Array.isArray(r.ingredient) ? r.ingredient[0] : r.ingredient
          return {
            id: r.id,
            ingredient_id: r.ingredient_id,
            ingredient_name: (ing as { name: string } | null)?.name || 'Unknown',
            quantity: r.quantity,
            unit: r.unit as IngredientUnit,
          }
        })
        setRecipeRows(rows)
        setOriginalRecipeIds(new Set(rows.map((r) => r.id!).filter(Boolean)))
        setRecipeLoading(false)
      })
  }, [open, editItem?.id])

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.setFieldsValue({
          name: editItem.name,
          price: editItem.price / 100,
          diet: editItem.diet,
          description: editItem.description || '',
          calories: editItem.calories ?? undefined,
          protein: editItem.protein ?? undefined,
          carbs: editItem.carbs ?? undefined,
          fats: editItem.fats ?? undefined,
          fibre: editItem.fibre ?? undefined,
          sugar: editItem.sugar ?? undefined,
          recipe: editItem.recipe || '',
          ingredients: editItem.ingredients || '',
          daily_limit: editItem.daily_limit ?? undefined,
          is_available: editItem.is_available,
        })
        setImageUrl(editItem.image_url || null)
      } else {
        form.resetFields()
        form.setFieldsValue({
          diet: 'veg',
          is_available: true,
        })
        setImageUrl(null)
      }
    }
  }, [open, editItem, form])

  const handleImageUpload = async (file: File) => {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      message.error('Image must be under 5MB')
      return false
    }
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed')
      return false
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const filePath = `menu-items/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      setImageUrl(urlData.publicUrl)
      message.success('Image uploaded')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
  }

  const handleAiFill = async () => {
    const name = form.getFieldValue('name')
    if (!name?.trim()) {
      message.warning('Enter a dish name first')
      return
    }

    setAiFilling(true)
    try {
      const diet = form.getFieldValue('diet') || 'veg'
      const resp = await fetch('/pm/api/cafe/ai-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), diet }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error || `Failed (${resp.status})`)
      }

      const data = await resp.json()
      form.setFieldsValue({
        description: data.description || form.getFieldValue('description'),
        calories: data.calories ?? form.getFieldValue('calories'),
        protein: data.protein ?? form.getFieldValue('protein'),
        carbs: data.carbs ?? form.getFieldValue('carbs'),
        fats: data.fats ?? form.getFieldValue('fats'),
        fibre: data.fibre ?? form.getFieldValue('fibre'),
        sugar: data.sugar ?? form.getFieldValue('sugar'),
        recipe: data.recipe || form.getFieldValue('recipe'),
        ingredients: data.ingredients || form.getFieldValue('ingredients'),
      })
      message.success('AI filled nutrition & recipe')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'AI fill failed')
    } finally {
      setAiFilling(false)
    }
  }

  // Recipe row management
  const addRecipeRow = useCallback(() => {
    setRecipeRows((prev) => [
      ...prev,
      { ingredient_id: '', ingredient_name: '', quantity: 0, unit: 'g' },
    ])
  }, [])

  const removeRecipeRow = useCallback((index: number) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateRecipeRow = useCallback((index: number, field: string, value: unknown) => {
    setRecipeRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        if (field === 'ingredient_id') {
          const ing = allIngredients.find((ig) => ig.id === value)
          return {
            ...row,
            ingredient_id: value as string,
            ingredient_name: ing?.name || '',
            unit: ing?.unit || row.unit, // default to ingredient's stock unit
          }
        }
        return { ...row, [field]: value }
      })
    )
  }, [allIngredients])

  // Save recipe rows to DB
  const saveRecipeRows = useCallback(async (menuItemId: string) => {
    const currentIds = new Set(recipeRows.map((r) => r.id).filter(Boolean))
    // Delete removed rows
    const toDelete = [...originalRecipeIds].filter((id) => !currentIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('cafe_recipe_items').delete().in('id', toDelete)
    }

    // Upsert current rows
    for (const row of recipeRows) {
      if (!row.ingredient_id || row.quantity <= 0) continue

      if (row.id) {
        // Update existing
        await supabase
          .from('cafe_recipe_items')
          .update({ ingredient_id: row.ingredient_id, quantity: row.quantity, unit: row.unit })
          .eq('id', row.id)
      } else {
        // Insert new
        await supabase.from('cafe_recipe_items').insert({
          menu_item_id: menuItemId,
          ingredient_id: row.ingredient_id,
          quantity: row.quantity,
          unit: row.unit,
        })
      }
    }
  }, [recipeRows, originalRecipeIds])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      // Save the menu item first
      const result = await onSubmit({
        category_id: categoryId,
        name: values.name,
        description: values.description || null,
        price: Math.round((values.price as number) * 100),
        diet: values.diet,
        image_url: imageUrl || null,
        calories: values.calories ?? null,
        protein: values.protein ?? null,
        carbs: values.carbs ?? null,
        fats: values.fats ?? null,
        fibre: values.fibre ?? null,
        sugar: values.sugar ?? null,
        recipe: values.recipe || null,
        ingredients: values.ingredients || null,
        daily_limit: values.daily_limit ?? null,
        is_available: values.is_available ?? true,
      })

      // Save recipe mappings — for edit (existing ID) or create (returned ID)
      const menuItemId = editItem?.id || (typeof result === 'string' ? result : null)
      if (menuItemId && recipeRows.length > 0) {
        setRecipeSaving(true)
        try {
          await saveRecipeRows(menuItemId)
        } catch (err) {
          console.error('Failed to save recipe:', err)
          message.warning('Menu item saved but recipe update failed')
        } finally {
          setRecipeSaving(false)
        }
      }

      onClose()
    } catch {
      // validation failed
    }
  }

  // Filter out already-selected ingredients from the dropdown
  const selectedIngredientIds = new Set(recipeRows.map((r) => r.ingredient_id).filter(Boolean))

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Item' : 'Add Item'}
      onCancel={onClose}
      confirmLoading={recipeSaving}
      destroyOnClose
      width={600}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Left: Delete (edit only) */}
          <div>
            {isEdit && onDelete && editItem && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(editItem)}
              >
                Delete
              </Button>
            )}
          </div>
          {/* Right: Cancel / Save */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleOk} loading={recipeSaving}>
              {recipeSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" size="middle">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. Dal Makhani" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price (₹)"
          rules={[{ required: true, message: 'Price is required' }]}
        >
          <InputNumber
            min={0}
            precision={2}
            prefix="₹"
            style={{ width: '100%' }}
            placeholder="e.g. 150"
          />
        </Form.Item>

        <Form.Item
          name="diet"
          label="Diet"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="veg">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Veg
              </span>
            </Radio>
            <Radio value="egg">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }} />
                Egg
              </span>
            </Radio>
            <Radio value="non_veg">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                Non-Veg
              </span>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Short description" />
        </Form.Item>

        <Form.Item label="Dish Photo">
          {imageUrl ? (
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <img
                src={imageUrl}
                alt="dish"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #303030' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute', top: -8, right: -8, background: '#ff4d4f',
                  border: 'none', borderRadius: '50%', width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', fontSize: 12,
                }}
              >
                <DeleteOutlined />
              </button>
            </div>
          ) : (
            <Upload.Dragger
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleImageUpload}
              disabled={uploading}
              style={{ padding: '12px 0' }}
            >
              <div style={{ textAlign: 'center' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#666' }} />
                <p style={{ margin: '8px 0 0', color: '#999', fontSize: 13 }}>
                  {uploading ? 'Uploading...' : 'Tap to upload or drag photo here'}
                </p>
              </div>
            </Upload.Dragger>
          )}
        </Form.Item>

        {/* AI Fill button */}
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ThunderboltOutlined />}
            loading={aiFilling}
            onClick={handleAiFill}
            style={{ background: '#cfff50', borderColor: '#cfff50', color: '#000', fontWeight: 500 }}
          >
            {aiFilling ? 'Filling...' : 'AI Fill Nutrition & Recipe'}
          </Button>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#8c8c8c' }}>
            Auto-fills from dish name
          </span>
        </div>

        {/* Nutrition grid */}
        <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Nutrition</div>
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item name="calories" label="Calories">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="kcal" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="protein" label="Protein (g)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="g" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="carbs" label="Carbs (g)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="g" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item name="fats" label="Fats (g)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="g" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="fibre" label="Fibre (g)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="g" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="sugar" label="Sugar (g)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="g" />
            </Form.Item>
          </Col>
        </Row>

        {/* Recipe text fields */}
        <Form.Item name="ingredients" label="Ingredients (text)">
          <Input.TextArea rows={2} placeholder="e.g. Rice, dal, ghee, cumin, turmeric..." />
        </Form.Item>

        <Form.Item name="recipe" label="Recipe Steps">
          <Input.TextArea rows={3} placeholder="Brief recipe steps..." />
        </Form.Item>

        {/* ── Recipe → Inventory Mapping ── */}
        <>
            <Divider style={{ margin: '12px 0 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>
                Inventory Mapping
                <span style={{ fontWeight: 400, color: '#8c8c8c', marginLeft: 6, fontSize: 12 }}>
                  ({recipeRows.length} ingredient{recipeRows.length !== 1 ? 's' : ''})
                </span>
              </div>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={addRecipeRow}
                style={{ background: '#cfff50', borderColor: '#cfff50', color: '#000' }}
              >
                Add
              </Button>
            </div>

            {recipeLoading ? (
              <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 12 }}>Loading recipe...</div>
            ) : recipeRows.length === 0 ? (
              <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#1a1a1a', borderRadius: 6 }}>
                No ingredients mapped. Add ingredients to auto-deduct from inventory when orders are accepted.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {/* Header */}
                <Row gutter={8} style={{ fontSize: 11, color: '#8c8c8c', paddingLeft: 4 }}>
                  <Col span={11}>Ingredient</Col>
                  <Col span={5}>Qty</Col>
                  <Col span={5}>Unit</Col>
                  <Col span={3} />
                </Row>

                {recipeRows.map((row, idx) => (
                  <Row key={row.id || `new-${idx}`} gutter={8} align="middle">
                    <Col span={11}>
                      <Select
                        size="small"
                        showSearch
                        placeholder="Search ingredient..."
                        value={row.ingredient_id || undefined}
                        onChange={(val) => updateRecipeRow(idx, 'ingredient_id', val)}
                        filterOption={(input, option) =>
                          (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={allIngredients
                          .filter((ig) => ig.id === row.ingredient_id || !selectedIngredientIds.has(ig.id))
                          .map((ig) => ({
                            label: `${ig.name} (${ig.unit})`,
                            value: ig.id,
                          }))}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={5}>
                      <InputNumber
                        size="small"
                        min={0}
                        step={1}
                        value={row.quantity}
                        onChange={(val) => updateRecipeRow(idx, 'quantity', val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={5}>
                      <Select
                        size="small"
                        value={row.unit}
                        onChange={(val) => updateRecipeRow(idx, 'unit', val)}
                        options={RECIPE_UNITS.map((u) => ({ label: u, value: u }))}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={3}>
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeRecipeRow(idx)}
                      />
                    </Col>
                  </Row>
                ))}
              </div>
            )}
        </>

        <Form.Item name="daily_limit" label="Daily Limit">
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
        </Form.Item>

        <Form.Item name="is_available" label="Available" valuePropName="checked">
          <Switch checkedChildren="Available" unCheckedChildren="86'd" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MenuItemForm
