import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  message,
  Radio,
  Select,
  TimePicker,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";

const { RangePicker } = DatePicker;

interface ActivitySchedulerSidebarProps {
  isModalOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedOperator: GeneralObject;
}

const DAYS_OF_WEEK = [
  { label: "Mon", value: "MON" },
  { label: "Tue", value: "TUE" },
  { label: "Wed", value: "WED" },
  { label: "Thu", value: "THU" },
  { label: "Fri", value: "FRI" },
  { label: "Sat", value: "SAT" },
  { label: "Sun", value: "SUN" },
];

const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

// Generate dates 1-31 for monthly selection
const DATES_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

// Time constraints: start time must be between 05:00 and 23:55
function disabledStartHours() {
  const all = Array.from({ length: 24 }, (_, h) => h);
  return all.filter((h) => h < 5 || h > 23);
}

function buildDisabledEndTime({ startTime }: { startTime?: Dayjs }) {
  const startHour = startTime ? startTime.hour() : undefined;
  const startMinute = startTime ? startTime.minute() : undefined;

  const disabledHours = () => {
    if (!startTime) {
      return Array.from({ length: 24 }, (_, h) => h).filter((h) => h > 23);
    }
    return Array.from({ length: 24 }, (_, h) => h).filter(
      (h) => h < (startHour as number)
    );
  };

  const disabledMinutes = (selectedHour: number) => {
    const capTo2355 =
      selectedHour === 23
        ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m > 55)
        : [];
    if (!startTime) return capTo2355;
    if (selectedHour === startHour) {
      const beforeOrEqualStart = Array.from({ length: 60 }, (_, m) => m).filter(
        (m) => m <= (startMinute as number)
      );
      return Array.from(new Set([...capTo2355, ...beforeOrEqualStart])).sort(
        (a, b) => a - b
      );
    }
    return capTo2355;
  };

  return {
    disabledHours,
    disabledMinutes,
  } as {
    disabledHours: () => number[];
    disabledMinutes: (h: number) => number[];
  };
}

function buildDisabledStartTime() {
  const disabledHours = disabledStartHours;
  const disabledMinutes = (selectedHour: number) =>
    selectedHour === 23
      ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m > 55)
      : [];
  return {
    disabledHours,
    disabledMinutes,
  } as {
    disabledHours: () => number[];
    disabledMinutes: (h: number) => number[];
  };
}

const ActivitySchedulerSidebar: React.FC<ActivitySchedulerSidebarProps> = ({
  isModalOpen,
  onClose,
  onSuccess,
  selectedOperator,
}) => {
  const [form] = Form.useForm<{
    startTime: Dayjs;
    endTime?: Dayjs | null;
    dateRange: [Dayjs, Dayjs];
    frequency: "weekly" | "monthly" | "yearly";
    weekDays?: string[];
    monthDays?: number[];
    months?: number[];
    pricing?: "paid" | "free";
    priceInr?: number;
    capacityType?: "infinite" | "limited";
    capacityCount?: number;
  }>();

  const [activitySearchValue, setActivitySearchValue] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<GeneralObject>();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { mutate: createInventorySchedule } = useMutationApi(
    "CAS_PM_INVENTORY_SCHEDULES",
    {},
    "",
    "POST"
  );
  const { mutate: createScheduledSKU } = useMutationApi(
    "CAS_PM_INVENTORY_SCHEDULES",
    {},
    "",
    "POST"
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(activitySearchValue.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [activitySearchValue]);

  const { data: activitySearchResults } = useQueryApi(
    "CAS_PM_INVENTORY",
    { enabled: selectedOperator?.code != null && debouncedSearch.length > 0 },
    "",
    `operator__pid=${
      selectedOperator.code
    }&type=activity&status=active&search=${encodeURIComponent(
      debouncedSearch
    )}&limit=10`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    form.resetFields();
    setActivitySearchValue("");
    setSelectedActivity(undefined);

    // Set default values
    const today = dayjs().startOf("day");
    const nextMonth = dayjs().add(1, "month").endOf("day");

    form.setFieldsValue({
      dateRange: [today, nextMonth],
      frequency: "weekly",
      pricing: "free",
      capacityType: "infinite",
      weekDays: [],
      monthDays: [],
      months: [],
    });
  }, [isModalOpen, form]);

  const generateRandomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const calculateDuration = (start: Dayjs, end: Dayjs | null): string => {
    if (!end) return "00:00:00";
    const diffInMs = end.diff(start);
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (!selectedActivity?.id) {
          message.error("Please select an activity");
          setIsSubmitting(false);
          return;
        }

        if (!selectedOperator?.code) {
          message.error("Please select an operator");
          setIsSubmitting(false);
          return;
        }

        const {
          frequency,
          weekDays,
          monthDays,
          months,
          dateRange,
          startTime,
          endTime,
        } = values;

        // Validate frequency-specific selections
        if (frequency === "weekly" && (!weekDays || weekDays.length === 0)) {
          message.error("Please select at least one day of the week");
          setIsSubmitting(false);
          return;
        }
        if (frequency === "monthly" && (!monthDays || monthDays.length === 0)) {
          message.error("Please select at least one date of the month");
          setIsSubmitting(false);
          return;
        }
        if (frequency === "yearly" && (!months || months.length === 0)) {
          message.error("Please select at least one month");
          setIsSubmitting(false);
          return;
        }

        // Generate random 4-digit alphanumeric ID
        const randomId = generateRandomId();

        // Object 1: Schedule Configuration
        const schedulePayload = {
          name: `${selectedActivity.name}_Schedule_${randomId}`,
          frequency: frequency.toUpperCase(),
          interval: 1,
          weekdays: frequency === "weekly" ? weekDays : [],
          months: frequency === "yearly" ? months : [],
          monthdays: frequency === "monthly" ? monthDays : [],
          inventory: selectedActivity.id,
        };

        // Object 2: SKU Configuration
        const startOfDay = dateRange[0].clone().startOf("day");
        const endOfDay = dateRange[1].clone().endOf("day");
        const duration = endTime
          ? calculateDuration(startTime, endTime || null)
          : null;

        const skuPayload = {
          price:
            values.pricing === "free"
              ? 0
              : (values.priceInr || 0) * Math.pow(10, 8),
          slabs: [],
          start_at: startOfDay.format("YYYY-MM-DDTHH:mm:ss"),
          end_at: endOfDay.format("YYYY-MM-DDTHH:mm:ss"),
          timings: [startTime.format("HH:mm")],
          duration: endTime ? duration : null,
          units: values.capacityType === "infinite" ? 1 : values.capacityCount,
          sellable: true,
          has_infinite_units: values.capacityType === "infinite",
        };

        createInventorySchedule(
          {
            data: schedulePayload,
          },
          {
            onSuccess: (scheduleData) => {
              message.success("Schedule created successfully");
              createScheduledSKU(
                {
                  data: skuPayload,
                  route: `${scheduleData.data.id}/skus/`,
                },
                {
                  onSuccess: () => {
                    message.success("SKU created successfully");
                    setIsSubmitting(false);
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    message.error("Something went wrong in scheduling");
                    setIsSubmitting(false);
                  },
                }
              );
              onClose();
            },
            onError: (error) => {
              message.error("Something went wrong in creating the schedule");
              setIsSubmitting(false);
            },
          }
        );
      })
      .catch(() => {
        setIsSubmitting(false);
      });
  };

  const disabledDate = useCallback((date: unknown) => {
    if (!date) return false;
    const maybe = date as { toDate?: () => Date } | Date | string;
    const current =
      typeof (maybe as { toDate?: () => Date }).toDate === "function"
        ? dayjs((maybe as { toDate: () => Date }).toDate())
        : dayjs(maybe as Date | string);
    const start = dayjs().startOf("day");
    const end = dayjs().add(6, "months").endOf("day");
    return current.isBefore(start) || current.isAfter(end);
  }, []);

  const frequency = Form.useWatch("frequency", form);

  return (
    <Drawer
      title="Schedule Activity"
      open={isModalOpen}
      onClose={isSubmitting ? () => {} : onClose}
      width={600}
      maskClosable={!isSubmitting}
      closable={!isSubmitting}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !selectedActivity}
          >
            Create Schedule
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="pb-20 flex flex-col gap-4">
        {/* Activity Selection */}
        <Form.Item label="Activity" className="mb-0" required>
          {selectedActivity ? (
            <div className="flex items-center justify-between gap-2 p-2 border rounded">
              <div className="truncate font-medium">
                {selectedActivity.name || selectedActivity.id}
              </div>
              <Button
                size="small"
                onClick={() => setSelectedActivity(undefined)}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          ) : (
            <Select
              showSearch
              value={activitySearchValue || undefined}
              placeholder="Search activities by name"
              onSearch={setActivitySearchValue}
              onChange={setActivitySearchValue}
              filterOption={false}
              notFoundContent="Type to search"
              options={(
                (
                  activitySearchResults as unknown as {
                    data?: { results?: GeneralObject[] };
                  }
                )?.data?.results || []
              ).map((a: GeneralObject) => ({
                label: a.name,
                value: a.id,
                raw: a,
              }))}
              onSelect={(_, opt) => {
                const option = opt as unknown as { raw?: GeneralObject };
                if (option.raw) setSelectedActivity(option.raw);
                setActivitySearchValue("");
              }}
              allowClear={false}
            />
          )}
        </Form.Item>

        {/* Date Range */}
        <Form.Item
          label="Schedule Duration"
          className="mb-0"
          name="dateRange"
          rules={[
            {
              required: true,
              message: "Please select date range",
            },
          ]}
        >
          <RangePicker
            className="w-full"
            format="YYYY-MM-DD"
            disabledDate={disabledDate}
            disabled={!selectedActivity}
          />
        </Form.Item>

        {/* Frequency Selection */}
        <Form.Item
          label="Frequency"
          name="frequency"
          className="mb-0"
          rules={[{ required: true, message: "Please select frequency" }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            disabled={!selectedActivity}
            className="w-full"
          >
            <Radio.Button value="weekly" className="flex-1 text-center">
              Weekly
            </Radio.Button>
            <Radio.Button value="monthly" className="flex-1 text-center">
              Monthly
            </Radio.Button>
            <Radio.Button value="yearly" className="flex-1 text-center">
              Yearly
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Frequency-specific selections */}
        {frequency === "weekly" && (
          <Form.Item
            label="Select Days"
            name="weekDays"
            className="mb-0"
            rules={[
              {
                required: true,
                message: "Please select at least one day",
              },
            ]}
          >
            <Checkbox.Group className="w-full">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Checkbox
                    key={day.value}
                    value={day.value}
                    disabled={!selectedActivity}
                  >
                    {day.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        )}

        {frequency === "monthly" && (
          <Form.Item
            label="Select Dates"
            name="monthDays"
            className="mb-0"
            rules={[
              {
                required: true,
                message: "Please select at least one date",
              },
            ]}
          >
            <Checkbox.Group className="w-full">
              <div className="grid grid-cols-7 gap-2">
                {DATES_OF_MONTH.map((date) => (
                  <Checkbox
                    key={date.value}
                    value={date.value}
                    disabled={!selectedActivity}
                  >
                    {date.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        )}

        {frequency === "yearly" && (
          <Form.Item
            label="Select Months"
            name="months"
            className="mb-0"
            rules={[
              {
                required: true,
                message: "Please select at least one month",
              },
            ]}
          >
            <Checkbox.Group className="w-full">
              <div className="grid grid-cols-2 gap-2">
                {MONTHS.map((month) => (
                  <Checkbox
                    key={month.value}
                    value={month.value}
                    disabled={!selectedActivity}
                  >
                    {month.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        )}

        {/* Time Selection */}
        <Form.Item label="Time" className="mb-0">
          <div className="flex gap-3">
            <Form.Item
              name="startTime"
              className="flex-1 mb-0"
              rules={[{ required: true, message: "Please select start time" }]}
            >
              <TimePicker
                placeholder="Start"
                format="HH:mm"
                minuteStep={5}
                className="w-full"
                disabled={!selectedActivity}
                disabledTime={buildDisabledStartTime}
                needConfirm={false}
                allowClear
                showNow={false}
                hideDisabledOptions
                inputReadOnly
                changeOnScroll={false}
              />
            </Form.Item>
            <Form.Item name="endTime" className="flex-1 mb-0">
              <TimePicker
                placeholder="End (optional)"
                format="HH:mm"
                minuteStep={5}
                className="w-full"
                disabled={!selectedActivity}
                disabledTime={() =>
                  buildDisabledEndTime({
                    startTime: form.getFieldValue("startTime"),
                  })
                }
                allowClear
                changeOnScroll={false}
                hideDisabledOptions
                needConfirm={false}
                showNow={false}
                inputReadOnly
              />
            </Form.Item>
          </div>
        </Form.Item>

        {/* Pricing */}
        <div className="flex gap-3 items-center">
          <Form.Item
            name="pricing"
            label="Pricing"
            initialValue="free"
            className="mb-0 flex-none"
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={!selectedActivity}
            >
              <Radio.Button value="free">Free</Radio.Button>
              <Radio.Button value="paid">Paid</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="flex-1">
            <Form.Item
              shouldUpdate={(prev, cur) => prev.pricing !== cur.pricing}
              noStyle
            >
              {({ getFieldValue }) =>
                getFieldValue("pricing") === "paid" ? (
                  <Form.Item
                    name="priceInr"
                    label="Price (INR)"
                    colon={false}
                    rules={[{ required: true, message: "Enter price in INR" }]}
                    className="flex-1 mb-0 grid grid-cols-[auto_1fr] items-center gap-2"
                    labelCol={{ flex: "none" }}
                  >
                    <InputNumber
                      min={0}
                      step={50}
                      className="w-full"
                      disabled={!selectedActivity}
                      placeholder="Enter amount in INR"
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex gap-3 items-center">
          <Form.Item
            label="Capacity"
            name="capacityType"
            initialValue="infinite"
            className="mb-0 flex-none"
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={!selectedActivity}
            >
              <Radio.Button value="infinite">Infinite</Radio.Button>
              <Radio.Button value="limited">Limited</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            shouldUpdate={(prev, cur) => prev.capacityType !== cur.capacityType}
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("capacityType") === "limited" ? (
                <Form.Item
                  name="capacityCount"
                  label="People Count"
                  colon={false}
                  rules={[{ required: true, message: "Enter people count" }]}
                  className="flex-1 mb-0 grid grid-cols-[auto_1fr] items-center gap-2"
                  labelCol={{ flex: "none" }}
                >
                  <InputNumber
                    min={1}
                    step={1}
                    className="w-full"
                    disabled={!selectedActivity}
                    placeholder="Enter people count"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default ActivitySchedulerSidebar;
