import { useQueryApi } from "@zo/auth";
import { Inventory, TripsSku } from "apps/admin/src/config";
import { isAfter, parseISO, startOfDay } from "date-fns";
import React, { useCallback, useMemo } from "react";
import { Form, FormElement } from "../../Form";

interface TripSelectionProps {
  tripForm: any;
  selectedBatch: string | null;
  selectedInventory: Inventory | null;
  setSelectedInventory: (inv: Inventory | null) => void;
  setSelectedBatch: (batchId: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedDatePrice: (price: number | null) => void;
  setTotalUnits: (units: number) => void;
}

const TripSelection: React.FC<TripSelectionProps> = ({
  tripForm,
  selectedBatch,
  selectedInventory,
  setSelectedInventory,
  setSelectedBatch,
  setSelectedDate,
  setSelectedDatePrice,
  setTotalUnits,
}) => {
  /** Availability API */
  const { data: availability } = useQueryApi<TripsSku[]>(
    "CAS_SKU",
    {
      enabled: Boolean(selectedInventory?.id && selectedBatch),
      select: (data) => data.data.results,
    },
    `${selectedBatch}/availability/`,
    "type=trip"
  );

  /** Pricing API */
  const { data: pricing } = useQueryApi<TripsSku[]>(
    "CAS_SKU",
    {
      enabled: !!selectedInventory && !!selectedBatch,
      select: (data) => data.data.results,
    },
    `${selectedBatch}/pricing/`,
    "type=trip"
  );

  /** MAP INVENTORY SKUS TO OPTIONS */
  const batchOptions = useMemo(() => {
    return (
      selectedInventory?.skus?.map((sku: any) => ({
        label: `${sku?.name} - ${sku?.itinerary?.title}`,
        value: sku?.id,
        sku,
      })) || []
    );
  }, [selectedInventory]);

  /** MAP AVAILABILITY TO DATE OPTIONS WITH PRICING */
  const dateOptions = useMemo(() => {
    if (!availability) return [];

    const today = startOfDay(new Date());

    return availability
      .filter((item) => {
        const itemDate = parseISO(item.date);
        return isAfter(itemDate, today) && item.units && item.units > 0;
      })
      .map((item) => {
        const pricingForDate = pricing?.find((p) => p.date === item.date);
        let priceDisplay = "";

        if (pricingForDate?.price != null && pricingForDate?.currency) {
          const symbol = pricingForDate.currency.symbol || "";
          const decimals = pricingForDate.currency.decimals ?? 0;
          const formattedPrice = (
            pricingForDate.price / Math.pow(10, decimals)
          ).toLocaleString();
          priceDisplay = ` - ${symbol}${formattedPrice}`;
        }

        return {
          label: `${item.date}${priceDisplay} - (${item.units || 0} Units)`,
          value: item.date,
        };
      });
  }, [availability, pricing]);

  /** FORM CONFIG */
  const tripFormFields: FormElement[] = useMemo(
    () => [
      {
        name: "trip",
        label: "Select Trip",
        type: "searchselect",
        searchQueryApi: "CAS_INVENTORY",
        customSearchQuery: "type=trip",
        selectedValueSelector: (data) => {
          setSelectedInventory(data as Inventory);
          setSelectedBatch(null);
          setSelectedDate(null);
          setSelectedDatePrice(null);
          setTotalUnits(0);
          tripForm.resetFields(["batch", "date", "total_units"]);
          return data?.id;
        },
        optionValueAndLabelSelector: (data) => ({
          value: data.id,
          label: data.name,
        }),
        responseFields: ["id", "name", "skus", "currency"],
        placeholder: "Search and select a trip...",
        rules: [{ required: true, message: "Please select a trip" }],
      },
      {
        name: "batch",
        label: "Select Group & Itinerary",
        type: "select",
        options: batchOptions,
        placeholder: "Select a group and itinerary...",
        rules: [
          { required: true, message: "Please select a group and itinerary" },
        ],
      },
      {
        name: "date",
        label: "Select Date",
        type: "select",
        options: dateOptions,
        placeholder: "Select a date",
        rules: [{ required: true, message: "Please select a date" }],
      },
      {
        name: "total_units",
        label: "Total Units",
        type: "number",
        minValue: 1,
        rules: [
          { required: true, message: "Please enter total Units" },
          {
            validator: (_, value) => {
              const selectedDate = tripForm.getFieldValue("date");
              const maxUnits = availability?.find(
                (item) => item.date === selectedDate
              )?.units;

              if (!value) return Promise.resolve();
              if (value < 1)
                return Promise.reject(new Error("Minimum 1 unit required"));
              if (maxUnits && value > maxUnits)
                return Promise.reject(
                  new Error(`Maximum ${maxUnits} units available`)
                );
              return Promise.resolve();
            },
          },
        ],
      },
    ],
    [batchOptions, dateOptions, setSelectedInventory]
  );

  /** HANDLE FORM VALUE CHANGES */
  const handleTripFormValuesChange = useCallback(
    (changedValues: any) => {
      if (changedValues.batch) {
        setSelectedBatch(changedValues.batch);
        setSelectedDatePrice(null);
        setSelectedDate(null);
      }
      if (changedValues.date) {
        setSelectedDate(changedValues.date);
        const pricingForDate = pricing?.find(
          (p) => p.date === changedValues.date
        );
        if (pricingForDate?.price != null && pricingForDate?.currency) {
          setSelectedDatePrice(pricingForDate.price);
        } else {
          setSelectedDatePrice(null);
        }
      }
      if (changedValues.total_units) setTotalUnits(changedValues.total_units);
    },
    [
      setSelectedBatch,
      setSelectedDate,
      setSelectedDatePrice,
      setTotalUnits,
      pricing,
    ]
  );

  return (
    <Form
      formData={tripForm}
      formFields={tripFormFields}
      onValueChange={handleTripFormValuesChange}
    />
  );
};

export default TripSelection;
