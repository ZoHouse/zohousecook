import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  Radio,
  Select,
  TimePicker,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { Activity, TimeSlotId } from "./ActivityCell";

interface SKUEditSidebarProps {
  isModalOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedOperator: GeneralObject;
  currentEditing: {
    slot: TimeSlotId;
    date: Date;
    activity?: Activity | null;
    sku?: GeneralObject | null;
    callback?: () => void;
  } | null;
  isMultiDayMode: boolean;
}

// Time constraints: start time must be between 05:00 and 23:00.
function disabledStartHours() {
  const all = Array.from({ length: 24 }, (_, h) => h);
  return all.filter((h) => h < 5 || h > 23);
}

// End time can be anything after selected start time. If same-day, disable
// hours/minutes earlier than or equal to the selected time. For multi-day
// (when end date > start date), nothing is disabled. Always cap to 23:55.
function buildDisabledEndTime({
  startTime,
  isMultiDay,
  dateRange,
}: {
  startTime?: Dayjs;
  isMultiDay: boolean;
  dateRange?: [Dayjs, Dayjs];
}) {
  const differentDays =
    isMultiDay && dateRange && dateRange[1] && dateRange[0]
      ? dateRange[1].startOf("day").isAfter(dateRange[0].startOf("day"))
      : false;
  const startHour = startTime ? startTime.hour() : undefined;
  const startMinute = startTime ? startTime.minute() : undefined;
  const disabledHours = () => {
    // For multi-day differences or when start not chosen, only cap >23
    if (!startTime || differentDays)
      return Array.from({ length: 24 }, (_, h) => h).filter((h) => h > 23);
    return Array.from({ length: 24 }, (_, h) => h).filter(
      (h) => h < (startHour as number)
    );
  };
  const disabledMinutes = (selectedHour: number) => {
    const capTo2355 =
      selectedHour === 23
        ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m > 55)
        : [];
    if (!startTime || differentDays) return capTo2355;
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
  return { disabledHours, disabledMinutes } as {
    disabledHours: () => number[];
    disabledMinutes: (h: number) => number[];
  };
}

// Slot bounds for start time when creating/editing from a block
const slotStartBounds: Record<
  TimeSlotId,
  { startHour: number; endHour: number }
> = {
  morning: { startHour: 5, endHour: 10 },
  day: { startHour: 11, endHour: 16 },
  evening: { startHour: 17, endHour: 19 },
  night: { startHour: 20, endHour: 22 },
};

const slotTitleMap: Record<TimeSlotId, string> = {
  morning: "Morning",
  day: "Day",
  evening: "Evening",
  night: "Night",
};

function buildDisabledStartTime({
  slot,
  isMultiDay,
}: {
  slot?: TimeSlotId;
  isMultiDay: boolean;
}) {
  // In multi-day mode, allow 05:00–23:55 as start
  if (isMultiDay || !slot) {
    const disabledHours = disabledStartHours;
    const disabledMinutes = (selectedHour: number) =>
      selectedHour === 23
        ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m > 55)
        : [];
    return { disabledHours, disabledMinutes } as {
      disabledHours: () => number[];
      disabledMinutes: (h: number) => number[];
    };
  }
  const { startHour, endHour } = slotStartBounds[slot];
  const allowed = new Set<number>();
  for (let h = startHour; h <= endHour; h++) allowed.add(h);
  const disabledHours = () =>
    Array.from({ length: 24 }, (_, h) => h).filter((h) => !allowed.has(h));
  const disabledMinutes = (selectedHour: number) =>
    selectedHour === 23
      ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m > 55)
      : [];
  return { disabledHours, disabledMinutes } as {
    disabledHours: () => number[];
    disabledMinutes: (h: number) => number[];
  };
}

const SKUEditSidebar: React.FC<SKUEditSidebarProps> = ({
  isModalOpen,
  onClose,
  onSuccess,
  selectedOperator,
  currentEditing,
  isMultiDayMode,
}) => {
  const [form] = Form.useForm<{
    startTime: Dayjs;
    endTime?: Dayjs | null;
    oneTimeDate?: Dayjs;
    pricing?: "paid" | "free";
    priceInr?: number;
    capacityType?: "infinite" | "limited";
    capacityCount?: number;
  }>();

  const { mutateAsync: createSku } = useMutationApi("CAS_PM_SKU");
  const { mutateAsync: updateSku } = useMutationApi(
    "CAS_PM_SKU",
    {},
    "",
    "PUT"
  );
  // inventory create/update not used here; SKU links to selected activity id

  const [activitySearchValue, setActivitySearchValue] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<GeneralObject>();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

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

  function valuesEqual(a: unknown, b: unknown): boolean {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return a === b;
    }
  }

  function buildDiff<T extends Record<string, unknown>>(
    next: T,
    prev?: Partial<T> | null
  ): Partial<T> {
    const patch: Partial<T> = {};
    Object.keys(next).forEach((key) => {
      const k = key as keyof T;
      const nextVal = next[k];
      const prevVal = prev ? (prev[k] as unknown) : undefined;
      if (!valuesEqual(nextVal, prevVal)) {
        (patch as Record<string, unknown>)[key] = nextVal as unknown;
      }
    });
    return patch;
  }

  useEffect(() => {
    if (!isModalOpen) return;
    form.resetFields();
    setActivitySearchValue("");
    const activity = currentEditing?.activity || null;
    const sku = (currentEditing?.sku as GeneralObject) || null;
    if (activity) {
      setSelectedActivity(activity as unknown as GeneralObject);
      const skuDateStr = sku?.date as string | undefined;
      const skuStartStr = sku?.start_time as string | undefined;
      const skuEndStr = (sku?.end_time as string | null) || null;
      const startM =
        skuDateStr && skuStartStr
          ? dayjs(`${skuDateStr}T${skuStartStr}`)
          : undefined;
      const endM =
        skuDateStr && skuEndStr ? dayjs(`${skuDateStr}T${skuEndStr}`) : null;
      form.setFieldsValue({
        oneTimeDate: skuDateStr ? dayjs(skuDateStr) : undefined,
        startTime: startM,
        endTime: endM,
        pricing: sku && sku.price === 0 ? "free" : "paid",
        priceInr:
          sku && sku.price
            ? (sku.price as number) / Math.pow(10, 8)
            : undefined,
        capacityType: sku && sku.has_infinite_units ? "infinite" : "limited",
        capacityCount: (sku && (sku.units as number)) || undefined,
      });
    } else {
      setSelectedActivity(undefined);
      const date = currentEditing?.date || new Date();
      form.setFieldsValue({
        oneTimeDate: dayjs(date).startOf("day"),
        pricing: "free",
        capacityType: "infinite",
        priceInr: undefined,
        capacityCount: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, currentEditing, isMultiDayMode]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (!currentEditing) {
          setIsSubmitting(false);
          return;
        }
        const existingActivity = currentEditing.activity;
        if (!existingActivity && !selectedActivity?.id) {
          message.error("Please select an activity");
          setIsSubmitting(false);
          return;
        }
        const { date } = currentEditing;
        const startMoment = values.startTime;
        const endMoment = values.endTime || null;

        const oneTimeDate: Dayjs | undefined = values.oneTimeDate;

        if (!selectedOperator?.code) {
          message.error("Please select an operator before saving");
          setIsSubmitting(false);
          return;
        }

        let finalStart: Dayjs;
        let finalEnd: Dayjs | null = null;

        if (oneTimeDate) {
          if (!startMoment) {
            message.error("Please select start time");
            setIsSubmitting(false);
            return;
          }
          finalStart = oneTimeDate
            .clone()
            .hour(startMoment.hour())
            .minute(startMoment.minute())
            .second(0)
            .millisecond(0);
          finalEnd = endMoment
            ? oneTimeDate
                .clone()
                .hour(endMoment.hour())
                .minute(endMoment.minute())
                .second(0)
                .millisecond(0)
            : null;
        } else {
          const dayDate = dayjs(date);
          finalStart = dayDate
            .clone()
            .hour(startMoment.hour())
            .minute(startMoment.minute())
            .second(0)
            .millisecond(0);
          finalEnd = endMoment
            ? dayDate
                .clone()
                .hour(endMoment.hour())
                .minute(endMoment.minute())
                .second(0)
                .millisecond(0)
            : null;
        }

        const startHour = finalStart.hour();
        const startMinute = finalStart.minute();
        if (startHour < 5 || (startHour === 23 && startMinute > 55)) {
          message.error("Start time must be between 05:00 and 23:55");
          setIsSubmitting(false);
          return;
        }
        if (currentEditing?.slot) {
          const { slot } = currentEditing;
          const slotBounds: Record<
            TimeSlotId,
            { startHour: number; endHour: number }
          > = {
            morning: { startHour: 5, endHour: 10 },
            day: { startHour: 11, endHour: 16 },
            evening: { startHour: 17, endHour: 19 },
            night: { startHour: 20, endHour: 22 },
          };
          const b = slotBounds[slot];
          if (
            finalStart.hour() < b.startHour ||
            finalStart.hour() > b.endHour
          ) {
            message.error("Start time must be within the selected slot");
            setIsSubmitting(false);
            return;
          }
        }
        if (finalEnd) {
          if (!finalEnd.isAfter(finalStart)) {
            message.error("End time must be after start time");
            setIsSubmitting(false);
            return;
          }
          const isSameDayEnd = finalEnd.isSame(finalStart, "day");
          if (
            isSameDayEnd &&
            finalEnd.hour() === 23 &&
            finalEnd.minute() > 55
          ) {
            message.error("End time must be on or before 23:55");
            setIsSubmitting(false);
            return;
          }
        }

        const skuPayload: GeneralObject = {
          price:
            values.pricing === "free"
              ? 0
              : (values.priceInr || 0) * Math.pow(10, 8),
          slabs: [],
          date: finalStart.clone().startOf("day").format("YYYY-MM-DD"),
          start_time: finalStart.format("HH:mm:ss"),
          end_time: finalEnd ? finalEnd.format("HH:mm:ss") : null,
          units: values.capacityType === "infinite" ? 1 : values.capacityCount,
          sellable: true,
          has_infinite_units: values.capacityType === "infinite",
        } as GeneralObject;

        const existingSku = currentEditing.sku as GeneralObject | undefined;

        try {
          if (existingActivity && (existingActivity as GeneralObject).id) {
            const skuPatch = existingSku
              ? buildDiff(
                  skuPayload as unknown as Record<string, unknown>,
                  existingSku as unknown as Record<string, unknown>
                )
              : {};

            const hasSkuChanges =
              existingSku && Object.keys(skuPatch).length > 0;

            if (!hasSkuChanges) {
              setIsSubmitting(false);
              onClose();
              return;
            }

            const promises: Promise<unknown>[] = [];

            if (hasSkuChanges && (existingSku as GeneralObject)?.id) {
              promises.push(
                new Promise((resolve, reject) =>
                  updateSku(
                    {
                      route: `${(existingSku as GeneralObject).id}/`,
                      data: skuPatch,
                    },
                    { onSuccess: resolve, onError: reject }
                  )
                )
              );
            }

            await Promise.all(promises);
            message.success("Activity updated");
            onSuccess();
            if (currentEditing.callback) currentEditing.callback();
            setIsSubmitting(false);
            onClose();
          } else {
            const newId = selectedActivity?.id;
            await createSku({
              data: {
                ...skuPayload,
                inventory: newId,
              },
            });
            message.success("Activity created");
            onSuccess();
            setIsSubmitting(false);
            onClose();
          }
        } catch (err) {
          setIsSubmitting(false);
          message.error("Failed to submit activity");
        }
      })
      .catch(() => {});
  };
  // Limit selectable dates to today through the next 2 months
  const disabledOneTimeDate = useCallback((date: unknown) => {
    if (!date) return false;
    // Support antd dayjs or raw Date by normalizing to dayjs
    const maybe = date as { toDate?: () => Date } | Date | string;
    const current =
      typeof (maybe as { toDate?: () => Date }).toDate === "function"
        ? dayjs((maybe as { toDate: () => Date }).toDate())
        : dayjs(maybe as Date | string);
    const start = dayjs().startOf("day");
    const end = dayjs().add(2, "months").endOf("day");
    return current.isBefore(start) || current.isAfter(end);
  }, []);

  return (
    <Drawer
      title={currentEditing?.activity ? "Edit Activity" : "Add Activity"}
      open={isModalOpen}
      onClose={isSubmitting ? () => {} : onClose}
      width={560}
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
            Save
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="pb-20 flex flex-col gap-4">
        <Form.Item label="Activity" className="mb-0" required>
          {selectedActivity ? (
            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                {selectedActivity.name || selectedActivity.id}
              </div>
              {!currentEditing?.activity && (
                <Button
                  size="small"
                  onClick={() => setSelectedActivity(undefined)}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              )}
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
        <Form.Item
          label="Date"
          className="mb-0"
          name="oneTimeDate"
          rules={[
            {
              required: true,
              message: "Please select date",
            },
          ]}
        >
          <DatePicker
            className="w-full"
            format="YYYY-MM-DD"
            disabledDate={disabledOneTimeDate}
            disabled
          />
        </Form.Item>

        <Form.Item
          label={
            currentEditing?.slot
              ? `Time (${slotTitleMap[currentEditing.slot]} Activity)`
              : "Time"
          }
          className="mb-0"
        >
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
                disabledTime={() =>
                  buildDisabledStartTime({
                    slot: currentEditing?.slot,
                    isMultiDay: isMultiDayMode,
                  })
                }
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
                    isMultiDay: isMultiDayMode,
                    dateRange: form.getFieldValue("oneTimeDate")
                      ? [
                          form.getFieldValue("oneTimeDate"),
                          form.getFieldValue("oneTimeDate"),
                        ]
                      : undefined,
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

export default SKUEditSidebar;
