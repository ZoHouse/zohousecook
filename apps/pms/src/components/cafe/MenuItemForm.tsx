import React, { useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Switch,
} from 'antd'
import type { MenuItem } from '../../types/cafe'

interface MenuItemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void
  editItem?: MenuItem | null
  categoryId: string
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  open,
  onClose,
  onSubmit,
  editItem,
  categoryId,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editItem

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.setFieldsValue({
          name: editItem.name,
          price: editItem.price / 100,
          diet: editItem.diet,
          description: editItem.description || '',
          image_url: editItem.image_url || '',
          calories: editItem.calories ?? undefined,
          daily_limit: editItem.daily_limit ?? undefined,
          is_available: editItem.is_available,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          diet: 'veg',
          is_available: true,
        })
      }
    }
  }, [open, editItem, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit({
        category_id: categoryId,
        name: values.name,
        description: values.description || null,
        price: Math.round((values.price as number) * 100),
        diet: values.diet,
        image_url: values.image_url || null,
        calories: values.calories ?? null,
        daily_limit: values.daily_limit ?? null,
        is_available: values.is_available ?? true,
      })
      onClose()
    } catch {
      // validation failed — do nothing
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Item' : 'Add Item'}
      okText="Save"
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
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
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                Veg
              </span>
            </Radio>
            <Radio value="egg">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#eab308',
                    display: 'inline-block',
                  }}
                />
                Egg
              </span>
            </Radio>
            <Radio value="non_veg">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    display: 'inline-block',
                  }}
                />
                Non-Veg
              </span>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Short description" />
        </Form.Item>

        <Form.Item name="image_url" label="Image URL">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="calories" label="Calories (kcal)">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 450" />
        </Form.Item>

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
