import { PlusOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { isValidUUID } from "@zo/utils/string";
import {
  Button,
  Checkbox,
  Drawer,
  Form,
  InputNumber,
  message,
  Select,
} from "antd";
import dayjs from "dayjs";
import { FC, useEffect, useState } from "react";
import { useQueryClient } from "react-query";

interface TripCostHeadProps {
  availabilityData: GeneralObject;
  selectedBatch: GeneralObject;
  isOpen: boolean;
  onClose: () => void;
}

const TripCostHead: FC<TripCostHeadProps> = ({
  availabilityData,
  selectedBatch,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedCostHeads, setSelectedCostHeads] = useState<string[]>([]);
  const [, costUpdateTrigger] = useState({});
  const [duplicateCosts, setDuplicateCosts] = useState<GeneralObject[]>([]);
  const [costHeads, setCostHeads] = useState<GeneralObject[]>([]);
  const [duplicateDate, setDuplicateDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availability, setAvailability] = useState<GeneralObject[]>([]);

  const { mutate: createCosts } = useMutationApi("CAS_COSTS", {}, "", "POST");

  const [costs, setCosts] = useState<GeneralObject[]>([]);

  const { refetch: refetchCosts } = useInfiniteTable({
    setter: setCosts,
    queryEndpoint: "CAS_COSTS",
    name: "costs",
    enabled: !!availabilityData?.date,
    customSearchQuery: `date=${availabilityData?.date}&order_by=-created_at`,
  });

  const { refetch: refetchCostHeads } = useInfiniteTable({
    setter: setCostHeads,
    queryEndpoint: "CAS_COST_HEADS",
    name: "cost-heads",
    customSearchQuery: `individual=1`,
  });

  const { refetch: fetchDuplicateCosts } = useInfiniteTable({
    setter: setDuplicateCosts,
    queryEndpoint: "CAS_COSTS",
    name: "duplicate-costs",
    customSearchQuery: `date=${duplicateDate}&order_by=-created_at`,
    enabled: !!duplicateDate,
  });

  const { refetch: refetchAvailability } = useInfiniteTable({
    setter: setAvailability,
    queryEndpoint: "CAS_SKU",
    customSearchQuery: `type=trip`,
    name: "trips",
    additionalRoute: `${selectedBatch.id}/availability/`,
    enabled: isOpen && isValidUUID(selectedBatch?.id),
  });

  useEffect(() => {
    if (costs && costs.length > 0) {
      const latestCost = costs[0];

      form.setFieldsValue({
        markup: latestCost.markup,
        zostel_margin: latestCost.margin,
      });

      const selectedHeadIds: string[] = [];

      costHeads.forEach((head) => {
        const headName = head.name.toLowerCase();
        if (latestCost.heads[headName]) {
          selectedHeadIds.push(head.id);
          form.setFieldsValue({
            [`cost_${head.id}`]: Number(latestCost.heads[headName]),
          });
        }
      });

      if (latestCost.heads.insurance) {
        form.setFieldsValue({
          insurance: Number(latestCost.heads.insurance),
        });
      }

      setSelectedCostHeads(selectedHeadIds);
    }
  }, [costs, costHeads, form]);

  const calculate = {
    percent: (base: number, rate: number) =>
      isNaN(base) || isNaN(rate) ? 0 : Number((base * rate) / 100).toFixed(2),
    perPerson: (amount: number) => {
      const units = availabilityData?.units || 1;
      return isNaN(amount) ? "0.00" : Number(amount / units).toFixed(2);
    },
  };

  const getFormValue = (field: string) =>
    Number(form.getFieldValue(field)) || 0;

  const tripCostValues = {
    totalTripCost: selectedCostHeads.reduce(
      (sum, id) => sum + getFormValue(`cost_${id}`),
      0
    ),
    tripInsurance: Number(getFormValue("insurance")).toFixed(2),
    tripMarkup: getFormValue("markup"),
    zostelCommission: getFormValue("zostel_margin"),
    merchandisePrice: getFormValue("merchandise_price") || 0,
    tdsPercentage: getFormValue("tds_percentage") || 3,
  };

  const perPersonTripCost = Number(
    calculate.perPerson(tripCostValues.totalTripCost)
  );
  const totalCostWithInsurance = Number(
    (perPersonTripCost + Number(tripCostValues.tripInsurance)).toFixed(2)
  );
  const tripMarkupAmount = Number(
    calculate.percent(totalCostWithInsurance, tripCostValues.tripMarkup)
  );
  const tripSellingPrice = Number(
    (totalCostWithInsurance + tripMarkupAmount).toFixed(2)
  );
  const baseTicketPrice = Number((tripSellingPrice / 1.05).toFixed(2));
  const zostelMarginAmount = Number(
    calculate.percent(baseTicketPrice, tripCostValues.zostelCommission)
  );
  const vendorPayoutAmount = Number(
    (
      baseTicketPrice -
      zostelMarginAmount -
      Number(tripCostValues.tripInsurance)
    ).toFixed(2)
  );
  const vendorPayoutAfterTDS = Number(
    (vendorPayoutAmount * (1 - tripCostValues.tdsPercentage / 100)).toFixed(2)
  );
  const vendorMarginAmount = Number(
    (vendorPayoutAmount - totalCostWithInsurance).toFixed(2)
  );
  const tripGSTAmount = Number((baseTicketPrice * 0.1).toFixed(2));
  const totalGroupPayout = Number(
    (
      (availabilityData?.units || 0) * vendorPayoutAfterTDS +
      tripCostValues.merchandisePrice
    ).toFixed(2)
  );

  // Display configuration
  const tripCostDisplay = [
    ["Total Trip Cost", totalCostWithInsurance.toFixed(2), true],
    ["Trip Insurance", tripCostValues.tripInsurance, false, "insurance"],
    [
      "Trip Markup",
      (
        Number(tripMarkupAmount.toFixed(2)) * (availabilityData?.units || 1)
      ).toFixed(2),
      false,
      "markup",
      tripMarkupAmount.toFixed(2),
    ],
    ["Final Selling Price", tripSellingPrice.toFixed(2), true],
    ["Base Ticket Price (per person)", baseTicketPrice.toFixed(2)],
    ["GST Amount (per person)", tripGSTAmount.toFixed(2)],
    [
      "Zostel Commission",
      (
        Number(zostelMarginAmount.toFixed(2)) * (availabilityData?.units || 1)
      ).toFixed(2),
      false,
      "zostel_margin",
      zostelMarginAmount.toFixed(2),
    ],
    ["Vendor Margin (per person)", vendorMarginAmount.toFixed(2)],
    ["Vendor Payout (per person)", vendorPayoutAmount.toFixed(2)],
    ["Vendor Payout after TDS (per person)", vendorPayoutAfterTDS.toFixed(2)],
    [
      "Merchandise Price",
      tripCostValues.merchandisePrice.toFixed(2),
      false,
      "merchandise_price",
    ],
    ["Total Group Payout", totalGroupPayout.toFixed(2), true],
  ] as const;

  const renderCostHead = (head: GeneralObject) => (
    <div key={head.id}>
      <div className="flex items-center">
        <Checkbox
          checked={selectedCostHeads.includes(head.id)}
          onChange={({ target: { checked } }) => {
            setSelectedCostHeads(
              checked
                ? [...selectedCostHeads, head.id]
                : selectedCostHeads.filter((id) => id !== head.id)
            );
            if (!checked) form.setFieldValue(`cost_${head.id}`, null);
            costUpdateTrigger({});
          }}
        >
          {head.name}
        </Checkbox>
      </div>
      <div>
        {selectedCostHeads.includes(head.id) ? (
          <Form.Item name={`cost_${head.id}`} className="mb-0">
            <InputNumber
              className="w-full dark-input"
              min={0}
              precision={2}
              onChange={() => costUpdateTrigger({})}
            />
          </Form.Item>
        ) : (
          "-"
        )}
      </div>
      <div className="flex items-center">
        {selectedCostHeads.includes(head.id)
          ? Number(
              calculate.perPerson(getFormValue(`cost_${head.id}`))
            ).toFixed(2)
          : "-"}
      </div>
    </div>
  );

  const handleSaveCosts = () => {
    // Get date from availabilityData instead of form
    const availabilityDate = availabilityData?.date;

    if (!availabilityDate) {
      message.error("No availability date found");
      return;
    }

    // Create heads object with cost head names and their values
    const heads: Record<string, string> = {};

    selectedCostHeads.forEach((headId) => {
      const amount = getFormValue(`cost_${headId}`);
      // Find the cost head name from costHeads array
      const costHead = costHeads.find((head) => head.id === headId);
      if (amount && costHead?.name) {
        heads[costHead.name.toLowerCase()] = amount.toFixed(2);
      }
    });

    // Add insurance if it exists
    const insurance = getFormValue("insurance");
    if (insurance) {
      heads["insurance"] = insurance.toFixed(2);
    }

    const payload = {
      date: availabilityDate,
      heads: heads,
      markup: getFormValue("markup"),
      margin: getFormValue("zostel_margin"),
    };

    createCosts(
      {
        data: payload,
        route: "",
      },
      {
        onSuccess() {
          queryClient.invalidateQueries(["cas", "costs"]);
          refetchCosts();
          message.success("Costs saved successfully");
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  useEffect(() => {
    if (duplicateCosts && duplicateCosts.length > 0 && costHeads.length > 0) {
      const costData = duplicateCosts[0];

      form.setFieldsValue({
        markup: Number(costData.markup),
        zostel_margin: Number(costData.margin),
      });

      const selectedHeadIds: string[] = [];

      costHeads.forEach((head) => {
        const headName = head.name.toLowerCase();
        if (costData.heads[headName]) {
          selectedHeadIds.push(head.id);
          form.setFieldsValue({
            [`cost_${head.id}`]: Number(costData.heads[headName]),
          });
        }
      });

      if (costData.heads.insurance) {
        form.setFieldsValue({
          insurance: Number(costData.heads.insurance),
        });
      }

      setSelectedCostHeads(selectedHeadIds);

      costUpdateTrigger({});
    }
  }, [duplicateCosts, costHeads, form]);

  const handleDuplicateSelect = (date: string) => {
    setSelectedDate(date);
    setDuplicateDate(date);
    fetchDuplicateCosts();
  };

  return (
    <Drawer
      title="Add Cost Head"
      placement="right"
      open={isOpen}
      width={640}
      onClose={onClose}
      extra={
        <Button onClick={() => handleSaveCosts()} type="primary">
          Save
        </Button>
      }
    >
      <div className="p-4">
        <div className="flex justify-end mb-6 gap-2">
          <Select
            className="w-48 dark-input"
            placeholder="Duplicate from date"
            onChange={handleDuplicateSelect}
            onClear={() => setSelectedDate(null)}
            value={selectedDate}
            allowClear
            options={availability
              .filter((batch) => batch.date !== availabilityData?.date)
              .map((batch) => ({
                label: dayjs(batch.date).format("DD MMM YYYY"),
                value: batch.date,
              }))}
          />
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={handleSaveCosts}
          >
            Save Costs
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => costUpdateTrigger({})}
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Headers */}
            {[
              "Cost Heads",
              "Cost",
              `Amount Per Person (Units: ${availabilityData?.units || 0})`,
            ].map((text) => (
              <div key={text} className="font-bold">
                {text}
              </div>
            ))}

            <div>TDS Percentage</div>
            <div>
              <Form.Item name="tds_percentage" className="mb-0">
                <InputNumber
                  className="w-full dark-input"
                  min={0}
                  max={100}
                  precision={2}
                  placeholder="Enter TDS %"
                  onChange={(value) => {
                    form.setFieldsValue({ tds_percentage: value });
                    costUpdateTrigger({}); // Force re-render to update calculations
                  }}
                  addonAfter="%"
                  defaultValue={3}
                />
              </Form.Item>
            </div>
            <div>-</div>

            {costHeads.map(renderCostHead)}

            {tripCostDisplay.map(
              ([label, value, isHeader, hasInput, perPersonValue]) => (
                <div key={label}>
                  <div
                    className={isHeader ? "font-bold bg-zui-lighter p-2" : ""}
                  >
                    {label}
                  </div>
                  <div>
                    {hasInput ? (
                      <Form.Item name={hasInput} className="mb-0">
                        <InputNumber
                          className="w-full dark-input"
                          min={0}
                          precision={2}
                          onChange={() => costUpdateTrigger({})}
                        />
                      </Form.Item>
                    ) : (
                      value
                    )}
                  </div>
                  <div className={isHeader ? "bg-zui-lighter p-2" : ""}>
                    {perPersonValue ||
                      (hasInput
                        ? calculate.perPerson(getFormValue(hasInput))
                        : value)}
                  </div>
                </div>
              )
            )}
          </div>
        </Form>
      </div>
    </Drawer>
  );
};

export default TripCostHead;
