import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber, Switch } from 'antd'
import type { CafeIngredient, IngredientUnit } from '../../types/cafe'

const CATEGORIES = [
  'Dairy', 'Fruits', 'Grains', 'Herbs & Spices', 'Meat', 'Oils & Fats',
  'Pantry', 'Produce', 'Proteins', 'Sauces', 'Seafood', 'Sweeteners',
  'Vegetables', 'Beverages', 'Bakery', 'Other',
]

const UNITS: IngredientUnit[] = ['kg', 'g', 'liter', 'ml', 'pieces', 'tbsp', 'tsp', 'cups', 'slice']

interface IngredientFormValues {
  name: string
  category: string
  unit: IngredientUnit
  unit_cost_rupees?: number | null
  supplier?: string | null
  is_active?: boolean
}

interface IngredientFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    category: string
    unit: IngredientUnit
    unit_cost_paise: number | null
    supplier: string | null
    is_active?: boolean
  }) => Promise<void>
  editIngredient?: CafeIngredient | null
}

const IngredientForm: React.FC<IngredientFormProps> = ({ open, onClose, onSubmit, editIngredient }) => {
  const [form] = Form.useForm<IngredientFormValues>()
  const isEdit = !!editIngredient

  useEffect(() => {
    if (open) {
      if (editIngredient) {
        form.setFieldsValue({
          name: editIngredient.name,
          category: editIngredient.category,
          unit: editIngredient.unit,
          unit_cost_rupees: editIngredient.unit_cost_paise != null
            ? editIngredient.unit_cost_paise / 100
            : undefined,
          supplier: editIngredient.supplier ?? undefined,
          is_active: editIngredient.is_active,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ category: 'Vegetables', unit: 'kg', is_active: true })
      }
    }
  }, [open, editIngredient, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await onSubmit({
        name: values.name,
        category: values.category,
        unit: values.unit,
        unit_cost_paise: values.unit_cost_rupees != null
          ? Math.round(values.unit_cost_rupees * 100)
          : null,
        supplier: values.supplier || null,
        is_active: values.is_active ?? true,
      })
      onClose()
    } catch {
      // validation failed — form will show inline errors
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Ingredient' : 'Add Ingredient'}
      okText="Save"
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. Paneer" />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Category is required' }]}
        >
          <Select
            placeholder="Select category"
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            showSearch
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Base Unit"
          rules={[{ required: true, message: 'Unit is required' }]}
        >
          <Select
            placeholder="Select unit"
            options={UNITS.map((u) => ({ label: u, value: u }))}
          />
        </Form.Item>

        <Form.Item name="unit_cost_rupees" label="Unit Cost (₹)">
          <InputNumber
            min={0}
            step={0.5}
            precision={2}
            placeholder="Optional"
            style={{ width: '100%' }}
            prefix="₹"
          />
        </Form.Item>

        <Form.Item name="supplier" label="Supplier">
          <Input placeholder="e.g. Blinkit / Hyperpure" />
        </Form.Item>

        {isEdit && (
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default IngredientForm
