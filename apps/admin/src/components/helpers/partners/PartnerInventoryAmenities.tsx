import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { App, Card } from "antd";
import { AmenityFeatureRelation } from "apps/admin/src/config";
import { renderMaterialIcon } from "apps/admin/src/utils";
import React, { MouseEventHandler, useState } from "react";
import { PartnerInventoryAmenitiesSidebar } from "../../sidebars";

interface PartnerInventoryAmenitiesProps {
  inventoryId: string;
  isActive: boolean;
}

const PartnerInventoryAmenities: React.FC<PartnerInventoryAmenitiesProps> = ({
  inventoryId,
  isActive,
}) => {
  const { message } = App.useApp();

  const [
    isAmenitiesSidebarVisible,
    showAmenitiesSidebar,
    hideAmenitiesSidebar,
  ] = useVisibilityState();

  const { data, refetch } = useQueryApi<AmenityFeatureRelation[]>(
    "CAS_FEATURES",
    {
      refetchOnWindowFocus: false,
      enabled: isValidString(inventoryId) && isActive,
      select: (data) => data.data.results,
    },
    `inventory/${inventoryId}/relations/`
  );

  const { mutate: deleteAmenity } = useMutationApi(
    "CAS_FEATURES",
    {},
    "",
    "DELETE"
  );

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    const id = e.currentTarget.dataset.id;
    e.stopPropagation();
    deleteAmenity(
      {
        data: {},
        route: `inventory/${inventoryId}/relations/${id}/`,
      },
      {
        onSuccess: () => {
          message.success("Amenity Deleted");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Amenities"
        buttons={[
          {
            icon: <PlusOutlined />,
            label: "Add Amenity",
            onClick: showAmenitiesSidebar,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        {data && (
          <div className="flex-grow my-6 ">
            <div className="flex flex-wrap gap-4">
              {data?.map((relation, index) => (
                <Card
                  key={index}
                  className="w-40 group hover:border-zui-neon transition-all duration-200"
                >
                  <div className="flex flex-col gap-4 items-center text-center">
                    <span className="text-3xl text-zui-neon group-hover:scale-110 transition-transform duration-200">
                      {renderMaterialIcon(relation?.feature?.icon)}
                    </span>
                    <h4 className="font-medium text-sm text-zui-silver line-clamp-2 w-full m-0">
                      {relation?.feature?.name}
                    </h4>
                  </div>

                  <button
                    data-id={relation.id}
                    data-relation-id={relation.relation_id}
                    onClick={handleDelete}
                    className="absolute -top-2 -right-2 flex-shrink-0 opacity-0 group-hover:opacity-100 bg-zui-red hover:bg-zui-red/80 p-1 shadow-lg transition-all duration-200 ease-in-out"
                  >
                    <DeleteOutlined />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <PartnerInventoryAmenitiesSidebar
          isOpen={isAmenitiesSidebarVisible}
          onClose={hideAmenitiesSidebar}
          containerId={inventoryId}
          containerType="inventory"
          refetch={refetch}
        />
      </PageContent>
    </>
  );
};

export default PartnerInventoryAmenities;
