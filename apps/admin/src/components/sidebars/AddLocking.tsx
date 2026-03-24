import { useMutationApi, useQueriesApi, useQueryApi } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  TreeSelect,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo } from "react";
import { Inventory, Sku, SkuAvailability } from "../../config";

interface AddLockingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateRange?: [Dayjs, Dayjs];
  initialOperator?: string;
  initialSkus?: string[];
  onLockinCreation: (lockinID: string) => void;
  refetch: () => void;
  allSkus?: Sku[];
}

const AddLockingSidebar: React.FC<AddLockingSidebarProps> = ({
  isOpen,
  onClose,
  initialDateRange,
  initialOperator,
  initialSkus,
  onLockinCreation,
  allSkus,
}) => {
  const [form] = Form.useForm();

  const selectedSku = Form.useWatch("sku", form);
  const { data: operators } = useQueryApi<
    {
      label: string;
      value: string;
    }[]
  >(
    "CAS_OPERATORS",
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: isOpen,
      select: (data) =>
        data.data.map((op: any) => ({
          label: op.name,
          value: op.id,
        })),
    },
    "",
    "limit=-1"
  );

  const { data: reasons } = useQueryApi<string[]>("CAS_SEED", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    select: (data) => data.data.sku_locking.reason,
  });

  const { data: inventoryQueries } = useQueryApi<string[]>(
    "CAS_INVENTORY",
    {
      enabled: isOpen && isValidString(form.getFieldValue("operator")),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: (data) => data.data.map((inventory: Inventory) => inventory.id),
    },
    "",
    `operator=${form.getFieldValue("operator")}&type=stay&limit=-1`
  );

  const { data: allInventoryDetail } = useQueryApi<Inventory[]>(
    "CAS_INVENTORY",
    {
      enabled: isOpen && inventoryQueries && inventoryQueries.length > 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: (data) => data.data.results,
    },
    "",
    `ids=${inventoryQueries?.join(",")}`
  );

  const { data: availability, isLoading: isAvailabilityLoading } = useQueryApi<
    SkuAvailability[]
  >(
    "CAS_STAY_DISCOVER_AVAILABILITY",
    {
      enabled:
        isOpen &&
        isValidString(selectedSku) &&
        !!initialDateRange?.[0] &&
        !!initialDateRange?.[1] &&
        initialDateRange[0].isValid() &&
        initialDateRange[1].isValid(),
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
    },
    "",
    `skus=${
      allSkus?.find((sku) => sku.id === selectedSku)?.pid
    }&start_date=${initialDateRange?.[0]?.format(
      "YYYY-MM-DD"
    )}&end_date=${initialDateRange?.[1]?.format("YYYY-MM-DD")}`
  );

  const maxUnits = useMemo(() => {
    return availability && availability?.length > 0
      ? availability?.reduce((acc, sku) => acc + sku.units, 0) /
          availability?.length
      : 1;
  }, [availability]);

  const { mutate: createLockin } = useMutationApi("CAS_LOCKING");

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dateRange = values.date_range;
      const startDate = dayjs(dateRange[0]);
      const endDate = dayjs(dateRange[1]);

      // Get total range length
      const totalDays = endDate.diff(startDate, "day") + 1;

      // Use all days except the last one
      const dates = Array.from({ length: totalDays - 1 }, (_, i) =>
        startDate.add(i, "day").format("YYYY-MM-DD")
      );

      const { date_range, ...restValues } = values;

      const _data = dates.map((date) => ({
        ...restValues,
        date,
      }));

      createLockin(
        {
          data: _data,
          route: `?sku=${form.getFieldValue("sku")}`,
        },
        {
          onSuccess: (data) => {
            onLockinCreation(data.data.id);
          },
        }
      );
    } catch (error) {
      message.error("Failed to create lock-in");
      console.error("Form validation failed:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      if (initialOperator) {
        form.setFieldValue("operator", initialOperator);
      }

      if (initialDateRange) {
        form.setFieldValue("date_range", initialDateRange);
      }

      if (initialSkus?.length) {
        form.setFieldValue("sku", initialSkus[0]);
      }
    }
  }, [isOpen]);

  const hasValidOperator = isValidString(form.getFieldValue("operator"));
  const hasValidSku = isValidString(form.getFieldValue("sku"));

  return (
    <Drawer
      title="Add Lock-in"
      placement="right"
      onClose={onClose}
      open={isOpen}
      extra={
        <Button onClick={onSubmit} type="primary">
          Add
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="operator"
          label="Operator"
          rules={[{ required: true, message: "Please select an operator" }]}
        >
          <Select placeholder="Select operator" options={operators} />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU"
          rules={[{ required: true, message: "Please select a SKU" }]}
        >
          <TreeSelect
            placeholder="Select SKU"
            disabled={!hasValidOperator}
            treeData={allInventoryDetail?.map((inventory) => {
              return {
                title: inventory?.name,
                value:
                  inventory?.skus.length === 1
                    ? inventory?.skus[0].id
                    : inventory?.id,
                selectable: inventory?.skus.length === 1,
                children:
                  inventory?.skus.length > 1
                    ? inventory?.skus.map((sku: Sku) => ({
                        title: `${inventory.name} → ${sku.name}`,
                        value: sku.id,
                      }))
                    : undefined,
              };
            })}
          />
        </Form.Item>

        <Form.Item
          name="date_range"
          label="Date Range"
          rules={[{ required: true, message: "Please select dates" }]}
        >
          <DatePicker.RangePicker
            format="DD-MM-YYYY"
            placeholder={["Start Date", "End Date"]}
            disabled={!hasValidOperator || !hasValidSku}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please select a reason" }]}
        >
          <Select
            placeholder="Select reason"
            disabled={!hasValidOperator || !hasValidSku}
            options={
              reasons
                ? reasons.map((reason) => ({
                    label: reason,
                    value: reason,
                  }))
                : []
            }
          />
        </Form.Item>

        <Form.Item
          name="units"
          label="Units"
          rules={[{ required: true, message: "Please enter number of units" }]}
        >
          <InputNumber
            min={1}
            placeholder="Enter units"
            max={maxUnits}
            style={{ width: "100%" }}
            disabled={!hasValidOperator || !hasValidSku}
          />
        </Form.Item>

        <Form.Item name="note" label="Note">
          <Input.TextArea
            rows={4}
            placeholder="Add any additional notes"
            disabled={!hasValidOperator || !hasValidSku}
          />
        </Form.Item>

        <Form.Item name="booking" label="Booking ID">
          <Input
            placeholder="Enter booking ID if applicable"
            disabled={!hasValidOperator || !hasValidSku}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddLockingSidebar;
