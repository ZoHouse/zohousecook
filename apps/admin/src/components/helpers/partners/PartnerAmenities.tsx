import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { App, Card, Empty } from "antd";
import { AmenityFeatureRelation } from "apps/admin/src/config";
import { renderMaterialIcon } from "apps/admin/src/utils";
import React, { useCallback } from "react";
import { PartnerInventoryAmenitiesSidebar } from "../../sidebars";

interface PartnerAmenitiesProps {
  operatorId: string;
}

const PartnerAmenities: React.FC<PartnerAmenitiesProps> = ({ operatorId }) => {
  const { message } = App.useApp();

  const [isSidebarVisible, showSidebar, hideSidebar] = useVisibilityState();

  // Fetch Amenities
  const { data: amenities, refetch } = useQueryApi<AmenityFeatureRelation[]>(
    "CAS_FEATURES",
    {
      refetchOnWindowFocus: false,
      enabled: isValidString(operatorId),
      select: (response) => response.data.results,
    },
    `operators/${operatorId}/relations/`
  );

  // Delete Amenity Mutation
  const { mutate: deleteAmenity } = useMutationApi(
    "CAS_FEATURES",
    {},
    "",
    "DELETE"
  );

  const handleDelete = useCallback(
    (id?: string) => {
      if (!id) return;

      deleteAmenity(
        {
          data: {},
          route: `operators/${operatorId}/relations/${id}/`,
        },
        {
          onSuccess: () => {
            message.success("Amenity deleted successfully");
            refetch();
          },
          onError: (error) => {
            message.error(processResponseError(error));
          },
        }
      );
    },
    [deleteAmenity, message, operatorId, refetch]
  );

  const renderAmenityCard = (
    relation: AmenityFeatureRelation,
    index: number
  ) => (
    <Card
      key={relation.id || index}
      className="relative w-40 group hover:border-zui-neon transition-all duration-200"
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
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(relation.id?.toString());
        }}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 
                   bg-zui-red hover:bg-zui-red/80 p-1 shadow-lg rounded-full 
                   transition-all duration-200 ease-in-out"
      >
        <DeleteOutlined />
      </button>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Amenities"
        buttons={[
          {
            icon: <PlusOutlined />,
            label: "Add Amenity",
            onClick: showSidebar,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <div className="flex-grow my-6">
          {amenities && amenities.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {amenities.map(renderAmenityCard)}
            </div>
          ) : (
            <Empty description="No amenities added yet" />
          )}
        </div>

        <PartnerInventoryAmenitiesSidebar
          isOpen={isSidebarVisible}
          onClose={hideSidebar}
          containerId={operatorId}
          refetch={refetch}
          containerType="operators"
        />
      </PageContent>
    </>
  );
};

export default PartnerAmenities;
