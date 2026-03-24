import { GeneralObject } from "@zo/definitions/general";
import { Empty, Table } from "antd";
import type { ColumnType } from "antd/es/table";
import React from "react";

export type ZudColumnType<RecordType = GeneralObject> =
  ColumnType<RecordType> & {
    /** Title text for the column header */
    title: string;
    /** Property name in record to display, can be nested using dot notation or array of keys */
    dataIndex: keyof RecordType | string | string[];
    /** Unique identifier for the column */
    key: string;
    /** Whether to hide this column from display */
    isHidden?: boolean;
    /** Width of column, can be number of pixels or CSS width value */
    width?: number | string;
    /** Pin column to left/right side of table */
    fixed?: "left" | "right" | boolean;
    /** Whether to show ellipsis for overflowing content */
    ellipsis?: boolean;
    /** Whether to show copy button for cell content */
    copyable?: boolean;
    /** Custom render function for cell content */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render?: (value: any, record: RecordType, index: number) => React.ReactNode;
    /** Enable sorting and optional custom sort function */
    sorter?: boolean | ((a: RecordType, b: RecordType) => number);
    /** Available sort directions for this column */
    sortDirections?: ("ascend" | "descend")[];
    /** Filter options to show in column header */
    filters?: { text: string; value: string | number | boolean }[];
    /** Custom filter function */
    onFilter?: (
      value: string | number | boolean,
      record: RecordType
    ) => boolean;
  };

interface ZudTableProps {
  columns: ZudColumnType[];
  data: GeneralObject[];
  className?: string;
  onRowClick?: (row: GeneralObject) => void;
  keyExtractor?: (row: GeneralObject) => string;
  isLoading?: boolean;
  tableClassName?: string;
  rowClassName?: (row: GeneralObject, index: number) => string;
}

const ZudTable: React.FC<ZudTableProps> = ({
  columns,
  data,
  className,
  keyExtractor,
  onRowClick,
  isLoading,
  rowClassName,
}) => {
  return (
    <Table
      className={className}
      columns={[
        {
          title: "#",
          key: "rowIndex",
          width: 50,
          render: (_text, _record, index) => index + 1,
        },
        ...columns,
      ]}
      dataSource={data}
      rowKey={(record) => keyExtractor?.(record) || record.id || record.key}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        className: `cursor-pointer hover:cursor-pointer ${
          rowClassName?.(record, data.indexOf(record)) || ""
        }`,
      })}
      loading={isLoading}
      locale={{
        emptyText: <Empty description="No Data" />,
      }}
      pagination={false}
      scroll={{ x: "max-content" }}
      showSorterTooltip={false}
      showHeader
    />
  );
};

export default ZudTable;
