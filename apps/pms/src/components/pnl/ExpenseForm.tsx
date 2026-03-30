import React, { useState } from 'react';
import { Form, Select, InputNumber, Input, DatePicker, Switch, Button, message, Card } from 'antd';
import dayjs from 'dayjs';
import type { CreateExpenseRequest, EntryType } from '../../types/pnl';
import { EXPENSE_CATEGORY_LABELS, REVENUE_CATEGORY_LABELS } from '../../types/pnl';

interface ExpenseFormProps {
  propertyId: string;
  createdBy: string;
  onSubmit: (req: CreateExpenseRequest) => Promise<boolean>;
}

export function ExpenseForm({ propertyId, createdBy, onSubmit }: ExpenseFormProps) {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('expense');

  const categories = entryType === 'expense'
    ? Object.entries(EXPENSE_CATEGORY_LABELS)
    : Object.entries(REVENUE_CATEGORY_LABELS);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    const req: CreateExpenseRequest = {
      property_id: propertyId,
      type: entryType,
      category: values.category,
      amount: Math.round(values.amount * 100),
      description: values.description || undefined,
      date: values.date.format('YYYY-MM-DD'),
      recurring: values.recurring || false,
      created_by: createdBy,
    };

    const success = await onSubmit(req);
    if (success) {
      message.success(`${entryType === 'expense' ? 'Expense' : 'Revenue'} added`);
      form.resetFields();
      form.setFieldsValue({ date: dayjs(), recurring: false });
    } else {
      message.error('Failed to save');
    }
    setIsSubmitting(false);
  };

  return (
    <Card title="Log Entry" className="mb-4">
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ date: dayjs(), recurring: false }}>
        <Form.Item label="Type">
          <Select value={entryType} onChange={(v) => { setEntryType(v); form.resetFields(['category']); }}>
            <Select.Option value="expense">Expense</Select.Option>
            <Select.Option value="revenue">Revenue</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select placeholder="Select category">
            {categories.map(([value, label]) => (
              <Select.Option key={value} value={value}>{label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={1} precision={0} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input placeholder="e.g., Monthly Airtel bill" />
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="recurring" label="Recurring monthly" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={isSubmitting} block>
          Add {entryType === 'expense' ? 'Expense' : 'Revenue'}
        </Button>
      </Form>
    </Card>
  );
}
