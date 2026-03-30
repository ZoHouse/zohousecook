import React from 'react';
import { Table, Tag, Button, Popconfirm, Card } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { PropertyExpense } from '../../types/pnl';
import { EXPENSE_CATEGORY_LABELS, REVENUE_CATEGORY_LABELS } from '../../types/pnl';

interface ExpenseListProps {
  expenses: PropertyExpense[];
  isLoading: boolean;
  canDelete: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

export function ExpenseList({ expenses, isLoading, canDelete, onDelete }: ExpenseListProps) {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string, record: PropertyExpense) => {
        const labels = record.type === 'expense' ? EXPENSE_CATEGORY_LABELS : REVENUE_CATEGORY_LABELS;
        return (
          <span>
            {(labels as any)[cat] || cat}
            {record.recurring && <Tag color="blue" className="ml-2">Recurring</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amt: number, record: PropertyExpense) => (
        <span style={{ color: record.type === 'expense' ? '#ef4444' : '#3ecf8e' }}>
          {record.type === 'expense' ? '-' : '+'}₹{(amt / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    ...(canDelete ? [{
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: PropertyExpense) => (
        <Popconfirm title="Delete this entry?" onConfirm={() => onDelete(record.id)}>
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Popconfirm>
      ),
    }] : []),
  ];

  return (
    <Card title="Recent Entries">
      <Table
        dataSource={expenses}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
}
