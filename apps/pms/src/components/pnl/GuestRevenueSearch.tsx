import React, { useState } from 'react';
import { Card, Input, Statistic, Row, Col, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { GuestRevenue } from '../../types/pnl';

function formatPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

interface GuestRevenueSearchProps {
  guest: GuestRevenue | null;
  isLoading: boolean;
  onSearch: (query: string) => void;
}

export function GuestRevenueSearch({ guest, isLoading, onSearch }: GuestRevenueSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <Card title="Guest Revenue">
      <Input.Search
        placeholder="Search by name or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={<SearchOutlined />}
        className="mb-4"
      />

      {isLoading && <div className="text-center py-8"><Spin /></div>}

      {!isLoading && guest && (
        <div>
          <div className="mb-4">
            <div className="text-lg font-semibold">{guest.name}</div>
            <div className="text-sm text-zui-silver">{guest.phone}</div>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Statistic title="Stay Revenue" value={formatPaise(guest.stay_revenue)} valueStyle={{ fontSize: '16px' }} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="Cafe Spend" value={formatPaise(guest.cafe_revenue)} valueStyle={{ fontSize: '16px' }} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="Total Revenue" value={formatPaise(guest.total_revenue)} valueStyle={{ fontSize: '18px', color: '#3ecf8e', fontWeight: 'bold' }} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="Nights" value={guest.nights} valueStyle={{ fontSize: '16px' }} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="ADR (Total)" value={formatPaise(guest.adr)} valueStyle={{ fontSize: '16px' }} />
            </Col>
          </Row>
        </div>
      )}

      {!isLoading && !guest && query && (
        <Empty description="No results found" />
      )}
    </Card>
  );
}
