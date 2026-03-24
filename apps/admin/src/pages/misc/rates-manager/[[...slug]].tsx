import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth, useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import type { TableColumnsType } from "antd";
import { Alert, DatePicker, Input, message, Modal, Select, Table } from "antd";
import { createStyles } from "antd-style";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import { PageContent, PageHeader } from "../../../components/ui2";
import { Inventory, Price, Sku, ZoHouse } from "../../../config";

const { RangePicker } = DatePicker;

const useStyles = createStyles(({ token }) => ({
  inventoryRow: {
    backgroundColor: "#121212",
    "& td": {
      backgroundColor: "#121212 !important",
      fontWeight: "bold",
      color: "#ffffff !important",
      "&:hover": {
        backgroundColor: "#121212 !important",
      },
    },
  },
  firstColumn: {
    position: "sticky",
    left: 0,
    backgroundColor: token.colorBgContainer,
    zIndex: 3,
  },
  skuRow: {
    backgroundColor: "#121212",
    "& td": {
      backgroundColor: "#121212 !important",
      color: "#ffffff",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#202020 !important",
      },
    },
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    backgroundColor: token.colorBgContainer,
    zIndex: 0,
    "&::before": {
      backgroundColor: token.colorBgContainer + " !important",
    },
  },
  firstColumnHeader: {
    position: "sticky",
    left: 0,
    zIndex: 4,
  },
  tableContainer: {
    maxHeight: "calc(100vh - 250px)",
    overflow: "auto",
  },
  cellWrapper: {
    position: "relative",
    "&:hover .editIcon": {
      opacity: 1,
    },
  },
  editIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    opacity: 0,
    transition: "opacity 0.2s",
    fontSize: "12px",
    color: "#888",
  },
}));

interface RatesManagerProps {}

const breadcrumbs = [
  { href: "/misc", label: "Miscellaneous" },
  { href: "/misc/rates-manager", label: "Rate Manager" },
];

const RatesManager: React.FC<RatesManagerProps> = () => {
  const { styles } = useStyles();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<{
    skuId: string;
    skuName: string;
    date: string;
    price: number;
    symbol: string;
    pid: string;
    decimals: number;
  } | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");

  const {} = useAuth();
  const profile = useProfile();

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [operator_id, date_range] = slug;

      return {
        operator_id: operator_id || null,
        date_range: date_range || null,
      };
    }
    return {
      operator_id: null,
      date_range: null,
    };
  }, [router.query]);

  const { data: operators } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_OPERATORS",
    {
      refetchOnWindowFocus: false,
      select(data) {
        return data.data.map((operator: ZoHouse) => ({
          label: operator.name,
          value: operator.id,
        }));
      },
    },
    "",
    "limit=-1"
  );

  const { data: stayInventories } = useQueryApi<Inventory[]>(
    "CAS_INVENTORY",
    {
      refetchOnWindowFocus: false,
      enabled: isValidString(params?.operator_id),
      select(data) {
        return data.data;
      },
    },
    "",
    `operator=${params?.operator_id}&limit=-1&type=stay`
  );

  const { data: utilityInventories } = useQueryApi<Inventory[]>(
    "CAS_INVENTORY",
    {
      enabled: isValidString(params?.operator_id),
      refetchOnWindowFocus: false,
      select(data) {
        return data.data;
      },
    },
    "",
    `operator=${params?.operator_id}&limit=-1&type=utility`
  );

  const inventories = useMemo(() => {
    return [...(stayInventories || []), ...(utilityInventories || [])];
  }, [stayInventories, utilityInventories]);

  const renderAllSkusQueryParam = useMemo(() => {
    if (inventories && inventories.length > 0 && params.date_range) {
      const allSkus = inventories.flatMap((inv) => inv.skus);
      const dateRange = {
        start: params.date_range?.split("to")[0],
        end: params.date_range?.split("to")[1],
      };

      return "skus="
        .concat(allSkus.map((sku: Sku) => sku.pid).join(","))
        .concat(
          `&start_date=${dayjs(dateRange.start).format(
            "YYYY-MM-DD"
          )}&end_date=${dayjs(dateRange.end).format("YYYY-MM-DD")}&user_pid=${
            profile.profile?.pid
          }`
        );
    } else {
      return "";
    }
  }, [inventories, params.date_range, profile.profile?.pid]);

  const {
    data: allSkuPricingList,
    isLoading: isPricesLoading,
    refetch: refetchPrices,
  } = useQueryApi<Price[]>(
    "CAS_PRICING",
    {
      enabled:
        isValidObject(profile) &&
        isValidString(params.operator_id) &&
        isValidString(renderAllSkusQueryParam),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    renderAllSkusQueryParam
  );

  //   mutations
  const { mutate: updateSkuPricing } = useMutationApi(
    "CAS_PRICING",
    undefined,
    "",
    "PUT"
  );

  const handleUpdateSkuPricing = (
    skuId: string,
    price: number,
    date: string
  ) => {
    updateSkuPricing(
      {
        data: {
          pid: skuId,
          price: price,
          date: date,
          slot: null,
        },
      },
      {
        onSuccess() {
          message.success("Sku pricing updated successfully!");
          setIsModalOpen(false);
          refetchPrices();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const dates = useMemo(() => {
    if (!params.date_range) return [];
    const [start, end] = params.date_range.split("to");
    const dates = [];
    let current = dayjs(start);
    while (current.isBefore(dayjs(end).add(1, "day"))) {
      dates.push(current.clone());
      current = current.add(1, "day");
    }
    return dates;
  }, [params.date_range]);

  const tableData = useMemo(() => {
    if (!inventories) return [];

    return inventories.flatMap((inventory) => {
      const inventoryRow = {
        key: `${inventory.id}`,
        inventoryName: inventory.name,
        isInventoryRow: true,
        level: 0,
        skuId: null,
      };

      const skuRows = inventory.skus.map((sku) => ({
        key: `${inventory.id}-${sku.pid}`,
        inventoryName: sku.name,
        isInventoryRow: false,
        level: 1,
        pid: sku.pid,
        skuId: sku.id,
      }));

      return [inventoryRow, ...skuRows];
    });
  }, [inventories]);

  const columns: TableColumnsType<any> = useMemo(() => {
    if (!dates.length) return [];

    return [
      {
        title: "Inventory & SKUs",
        dataIndex: "inventoryName",
        key: "inventoryName",
        fixed: "left",
        width: 300,
        onCell: (record) => ({
          className: styles.firstColumn,
        }),
        onHeaderCell: () => ({
          className: `${styles.stickyHeader} ${styles.firstColumnHeader}`,
        }),
        render: (text, record) => {
          const indent = record.level * 24;
          return (
            <span
              style={{
                paddingLeft: indent,
                display: "block",
                color: record.isInventoryRow ? "#fff" : "#fff",
              }}
            >
              {text}
            </span>
          );
        },
      },
      ...dates.map((date) => ({
        title: date.format("DD MMM YYYY"),
        dataIndex: date.format("YYYY-MM-DD"),
        key: date.format("YYYY-MM-DD"),
        width: 120,
        align: "center" as const,
        onCell: (record: GeneralObject) => {
          const skuPrice = allSkuPricingList?.find(
            (price) =>
              price.pid === record.pid &&
              price.date === date.format("YYYY-MM-DD")
          );
          if (skuPrice) {
            const finalPrice =
              skuPrice.price * Math.pow(10, -skuPrice.currency.decimals);
            return {
              onClick: () => {
                if (!record.isInventoryRow) {
                  setSelectedPrice({
                    pid: record.pid,
                    skuId: record.skuId,
                    skuName: record.inventoryName,
                    date: date.format("YYYY-MM-DD"),
                    price: finalPrice,
                    symbol: skuPrice.currency.symbol,
                    decimals: skuPrice.currency.decimals,
                  });
                  setNewPrice(finalPrice.toString());
                  setIsModalOpen(true);
                }
              },
              className: styles.stickyHeader,
            };
          }
          return {
            className: styles.stickyHeader,
            onClick: () => {
              if (!record.isInventoryRow) {
                setSelectedPrice({
                  pid: record.pid,
                  skuId: record.skuId,
                  skuName: record.inventoryName,
                  date: date.format("YYYY-MM-DD"),
                  price: 0,
                  symbol: "$",
                  decimals: 0,
                });
                setNewPrice("0");
                setIsModalOpen(true);
              }
            },
          };
        },
        render: (_: any, record: any) => {
          if (record.isInventoryRow) return null;
          const skuPrice = allSkuPricingList?.find(
            (price) =>
              price.pid === record.pid &&
              price.date === date.format("YYYY-MM-DD")
          );
          if (skuPrice) {
            const finalPrice =
              skuPrice.price * Math.pow(10, -skuPrice.currency.decimals);
            return (
              <div className={styles.cellWrapper}>
                <span
                  style={{
                    cursor: "pointer",
                  }}
                  className="text-white h-full w-full"
                >
                  {finalPrice
                    ? `${skuPrice.currency.symbol} ${finalPrice.toFixed(2)}`
                    : "-"}
                </span>
                <EditIcon
                  style={{ fontSize: "16px" }}
                  className={`${styles.editIcon} editIcon`}
                />
              </div>
            );
          }
          return (
            <div className={styles.cellWrapper}>
              <span className="text-zui-silver">-</span>
              <EditIcon
                style={{ fontSize: "16px" }}
                className={`${styles.editIcon} editIcon`}
              />
            </div>
          );
        },
      })),
    ];
  }, [dates, styles.firstColumn, allSkuPricingList]);

  const handleOperatorChange = (value: string) => {
    router.push(
      {
        pathname: `/misc/rates-manager/${value}/`,
        query: {
          date: dayjs().format("YYYY-MM-DD"),
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleDateRangeChange = (dateStrings: [string, string]) => {
    if (!dates) return;
    router.push(
      {
        pathname: `/misc/rates-manager/${params.operator_id}/${dateStrings[0]}to${dateStrings[1]}`,
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader title="Rate Manager" rightOptions={<div></div>} />
      <PageContent className="pt-6">
        <div className="flex flex-col h-full gap-y-6 w-full">
          <div className="flex gap-4 items-center">
            <Select
              value={params?.operator_id || undefined}
              onChange={handleOperatorChange}
              options={operators || []}
              placeholder="Select Operator"
              size="large"
              suffixIcon={<BusinessIcon />}
              style={{ width: 200 }}
            />
            <RangePicker
              size="large"
              value={
                params.date_range
                  ? [
                      dayjs(params.date_range.split("to")[0]),
                      dayjs(params.date_range.split("to")[1]),
                    ]
                  : undefined
              }
              onChange={(dates, dateStrings) => {
                if (dates) handleDateRangeChange(dateStrings);
              }}
              suffixIcon={<CalendarTodayIcon />}
            />
          </div>

          {!params.operator_id && (
            <Alert message="Please select an operator" type="info" showIcon />
          )}

          {params.operator_id && !params.date_range && (
            <Alert message="Please select a date range" type="info" showIcon />
          )}

          {params.operator_id &&
            params.date_range &&
            inventories?.length === 0 && (
              <Alert
                message="No inventories found for this operator"
                type="warning"
                showIcon
              />
            )}

          {inventories && params.date_range && (
            <div className={styles.tableContainer}>
              <Table
                loading={isPricesLoading}
                columns={columns.map((col) => ({
                  ...col,
                  onHeaderCell: () => ({
                    className: styles.stickyHeader,
                  }),
                }))}
                dataSource={tableData}
                scroll={{ x: "max-content" }}
                pagination={false}
                bordered
                size="large"
                className="bg-zui-dark"
                onRow={(record) => ({
                  className: record.isInventoryRow
                    ? styles.inventoryRow
                    : styles.skuRow,
                })}
                sticky={{ offsetHeader: 0 }}
              />
            </div>
          )}

          <Modal
            title="Update Price"
            open={isModalOpen}
            onOk={() => {
              if (selectedPrice) {
                handleUpdateSkuPricing(
                  selectedPrice.pid,
                  parseFloat(newPrice) * Math.pow(10, selectedPrice.decimals),
                  selectedPrice.date
                );
              }
            }}
            onCancel={() => setIsModalOpen(false)}
          >
            {selectedPrice && (
              <div className="flex flex-col gap-4">
                <div>
                  <p>SKU: {selectedPrice.skuName}</p>
                  <p>Date: {selectedPrice.date}</p>
                  <p>
                    Current Price: {selectedPrice.symbol}{" "}
                    {selectedPrice.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label>New Price:</label>
                  <Input
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    prefix={selectedPrice.symbol}
                  />
                </div>
              </div>
            )}
          </Modal>
        </div>
      </PageContent>
    </Page>
  );
};

export default RatesManager;
