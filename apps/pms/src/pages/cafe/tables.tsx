import React, { useState } from 'react'
import { NextPage } from 'next'
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Spin,
  Typography,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import TableQRCard from '../../components/cafe/TableQRCard'
import { useCafeTables } from '../../hooks/cafe/useCafeTables'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import type { CafeTable } from '../../types/cafe'

const { Title } = Typography

interface AddTableFormValues {
  code: string
  label?: string
  area: string
  capacity: number
}

const CafeTablesPage: NextPage = () => {
  const { propertyId, isLoading: propertyLoading } = usePropertyId()
  const [form] = Form.useForm<AddTableFormValues>()
  const [submitting, setSubmitting] = useState(false)

  const { tables, isLoading, createTable, toggleActive } = useCafeTables(propertyId ?? null)

  // Group tables by area
  const areas = [...new Set(tables.map((t) => t.area))].sort()

  const handleAddTable = async (values: AddTableFormValues) => {
    setSubmitting(true)
    try {
      await createTable({
        code: values.code.trim(),
        label: values.label?.trim() || null,
        area: values.area.trim(),
        capacity: values.capacity,
      })
      message.success('Table created')
      form.resetFields()
      form.setFieldsValue({ capacity: 4 })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create table')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id, isActive)
    } catch {
      message.error('Failed to update table')
    }
  }

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Tables" icon="Table" />
        <PageContent>
          {/* Add table form */}
          <Form
            form={form}
            layout="inline"
            onFinish={handleAddTable}
            initialValues={{ capacity: 4 }}
            style={{ marginBottom: 24, flexWrap: 'wrap', gap: 8 }}
          >
            <Form.Item
              name="code"
              rules={[{ required: true, message: 'Code required' }]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="Code (T-01)" style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="label" style={{ marginBottom: 8 }}>
              <Input placeholder="Label (optional)" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item
              name="area"
              rules={[{ required: true, message: 'Area required' }]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="Area (e.g. Dining Area)" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item
              name="capacity"
              rules={[{ required: true, message: 'Capacity required' }]}
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={1}
                max={30}
                placeholder="Seats"
                style={{ width: 90 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={submitting}
              >
                Add Table
              </Button>
            </Form.Item>
          </Form>

          {/* Loading */}
          {(propertyLoading || isLoading) && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          )}

          {/* No property selected */}
          {!propertyLoading && !propertyId && (
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '40px 0' }}>
              Select a property to view tables.
            </div>
          )}

          {/* Tables grouped by area */}
          {!isLoading && propertyId && areas.length === 0 && (
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '40px 0' }}>
              No tables yet. Add the first one above.
            </div>
          )}

          {!isLoading && areas.map((area) => (
            <div key={area} style={{ marginBottom: 32 }}>
              <Divider orientation="left" orientationMargin={0}>
                <Title level={5} style={{ margin: 0 }}>{area}</Title>
              </Divider>
              <Row gutter={[12, 12]}>
                {tables
                  .filter((t: CafeTable) => t.area === area)
                  .map((table: CafeTable) => (
                    <Col key={table.id} xs={24} sm={12} md={8} lg={6}>
                      <TableQRCard
                        table={table}
                        onToggleActive={handleToggleActive}
                      />
                    </Col>
                  ))}
              </Row>
            </div>
          ))}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default CafeTablesPage
