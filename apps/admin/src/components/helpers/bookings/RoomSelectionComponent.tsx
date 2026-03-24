import { GeneralObject } from "@zo/definitions/general";
import { DatePicker, Empty, Spin, Tag, Typography } from "antd";
import { Price, Sku, SkuAvailability } from "apps/admin/src/config";
import dayjs, { Dayjs } from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import RoomCard from "./RoomCard";

const { Title, Text } = Typography;

interface RoomSelectionComponentProps {
  groupedSkus: GeneralObject;
  activeTab: "stay" | "utility";
  handleRoomSelect: (sku: Sku) => void;
  selectedRoomIds: Set<string>;
  pricingList: Price[];
  availabilityList: SkuAvailability[];
  loading?: boolean;
  setDate: ((date: [Dayjs, Dayjs]) => void) | ((date: Dayjs) => void);
  date: [Dayjs, Dayjs] | Dayjs;
  selectedItems: Sku[];
}

const RoomSelectionComponent: React.FC<RoomSelectionComponentProps> = ({
  groupedSkus,
  activeTab,
  handleRoomSelect,
  selectedRoomIds,
  pricingList,
  availabilityList,
  loading = false,
  date,
  setDate,
  selectedItems,
}) => {
  if (!groupedSkus || Object.keys(groupedSkus).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty
          description={
            <Text type="secondary">
              {activeTab === "stay"
                ? "No Rooms Available"
                : "No Spaces Available"}
            </Text>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div className="flex flex-col h-full">
        {/* add the ant design date range picker here */}
        {activeTab === "stay" ? (
          <DatePicker.RangePicker
            className="w-full md:w-1/2"
            size="large"
            value={date as [Dayjs | null, Dayjs | null]}
            onChange={(value: [Dayjs | null, Dayjs | null] | null) =>
              (setDate as (date: [Dayjs | null, Dayjs | null]) => void)(
                value ?? [null, null]
              )
            }
            disabledDate={(current) => current < dayjs().startOf("day")}
          />
        ) : (
          <DatePicker
            className="w-full md:w-1/2 mt-2"
            size="large"
            value={date as Dayjs}
            onChange={(value: Dayjs | null) =>
              (setDate as (date: Dayjs) => void)(value || dayjs())
            }
            disabledDate={(current) => current < dayjs().startOf("day")}
          />
        )}
        <br />

        <AnimatePresence mode="wait">
          {selectedItems.length > 0 && (
            <motion.div
              key="selected-items"
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <div className="bg-zui-lighter p-4 mb-4">
                <Title level={5} className="text-zui-silver uppercase mb-2">
                  Selected {activeTab === "stay" ? "Rooms" : "Spaces"}
                </Title>
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map((sku: Sku) => (
                    <motion.div
                      key={sku.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <Tag
                        className="bg-zui-light px-3 py-1 rounded"
                        closable
                        onClose={() => handleRoomSelect(sku)}
                      >
                        {sku.name}
                      </Tag>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto pb-20 p-2">
          {Object.entries(groupedSkus).map(([category, skus]) => (
            <div key={category} className="mb-8">
              <Title level={5} className="text-zui-silver uppercase mb-4">
                {category}
              </Title>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {(skus as Sku[]).map((sku: Sku) => (
                  <RoomCard
                    key={sku.id}
                    inventoryType={activeTab}
                    data={sku}
                    onSelect={handleRoomSelect}
                    selected={selectedRoomIds.has(sku.id)}
                    priceData={pricingList?.filter(
                      (pricing: Price) => pricing.pid === sku.pid
                    )}
                    availabilityData={availabilityList?.filter(
                      (availability: SkuAvailability) =>
                        availability.pid === sku.pid
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Spin>
  );
};

export default RoomSelectionComponent;