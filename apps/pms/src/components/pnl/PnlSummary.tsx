import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography } from 'antd';
import type { PnlData } from '../../types/pnl';
import { EXPENSE_CATEGORY_LABELS, EBITDA_TARGET_PAISE } from '../../types/pnl';

const { Text } = Typography;

function formatPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

interface PnlSummaryProps {
  pnl: PnlData;
}

export function PnlSummary({ pnl }: PnlSummaryProps) {
  const ebitdaPercent = Math.min(
    100,
    Math.max(0, Math.round((pnl.ebitda / EBITDA_TARGET_PAISE) * 100))
  );

  return (
    <div>
      <Card className="mb-4">
        <Text strong className="text-zui-silver text-xs uppercase">Revenue</Text>
        <Statistic
          value={pnl.total_revenue / 100}
          prefix="₹"
          precision={0}
          className="mt-2"
          valueStyle={{ color: '#3ecf8e', fontSize: '28px' }}
        />
        <Row gutter={[16, 8]} className="mt-4">
          <Col xs={8}>
            <Statistic title="Stays" value={formatPaise(pnl.stay_revenue)} valueStyle={{ fontSize: '16px' }} />
          </Col>
          <Col xs={8}>
            <Statistic title="Cafe" value={formatPaise(pnl.cafe_revenue)} valueStyle={{ fontSize: '16px' }} />
          </Col>
          <Col xs={8}>
            <Statistic title="Other" value={formatPaise(pnl.other_revenue)} valueStyle={{ fontSize: '16px' }} />
          </Col>
        </Row>
      </Card>

      <Card className="mb-4">
        <Text strong className="text-zui-silver text-xs uppercase">Expenses</Text>
        <Statistic
          value={pnl.total_expenses / 100}
          prefix="₹"
          precision={0}
          className="mt-2"
          valueStyle={{ color: '#ef4444', fontSize: '28px' }}
        />
        <div className="mt-4 space-y-2">
          {pnl.expenses_by_category.map((exp) => (
            <div key={exp.category} className="flex justify-between text-sm">
              <Text className="text-zui-silver">
                {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
              </Text>
              <Text>{formatPaise(exp.total)}</Text>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Text strong className="text-zui-silver text-xs uppercase">EBITDA</Text>
        <Statistic
          value={pnl.ebitda / 100}
          prefix="₹"
          precision={0}
          className="mt-2"
          valueStyle={{
            color: pnl.ebitda >= 0 ? '#3ecf8e' : '#ef4444',
            fontSize: '32px',
            fontWeight: 'bold',
          }}
        />
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zui-silver mb-1">
            <span>Progress to ₹5L target</span>
            <span>{formatPaise(pnl.ebitda)} / ₹5L</span>
          </div>
          <Progress
            percent={ebitdaPercent}
            strokeColor={pnl.ebitda >= 0 ? '#3ecf8e' : '#ef4444'}
            trailColor="#2a2a3e"
            showInfo={false}
          />
        </div>
      </Card>
    </div>
  );
}
