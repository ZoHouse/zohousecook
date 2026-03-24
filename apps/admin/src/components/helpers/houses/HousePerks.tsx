import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { App, Button, Card, Empty, Space, Typography } from "antd";
import { CASFeaturesResponse } from "apps/admin/src/config";
import { MouseEventHandler, useState } from "react";
import { FeaturesSidebar } from "../../sidebars";

interface HousePerksProps {
  operatorId: string;
}

const HousePerks: React.FC<HousePerksProps> = ({ operatorId }) => {
  const { message } = App.useApp();

  const [isFeaturesSidebarVisible, showFeaturesSidebar, hideFeaturesSidebar] =
    useVisibilityState();

  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const { data: allFeatures, refetch } = useQueryApi<CASFeaturesResponse[]>(
    "CAS_OPERATORS",
    {
      refetchOnWindowFocus: false,
      enabled: operatorId != undefined,
      select: (data) => data.data.results,
    },
    `${operatorId}/features/`
  );

  const { mutate: createFeature } = useMutationApi("CAS_OPERATORS");
  const { mutate: updateFeature } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "PUT"
  );
  const { mutate: deleteFeature } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "DELETE"
  );

  const saveFeatureHandler = (data: GeneralObject) => {
    createFeature(
      {
        data: data,
        route: `${operatorId}/features/`,
      },
      {
        onSuccess: () => {
          message.success("Perk Added");
          refetch();
          hideFeaturesSidebar();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleDeleteFeature: MouseEventHandler<HTMLButtonElement> = (e) => {
    const id = e.currentTarget.dataset.id;
    e.stopPropagation();
    deleteFeature(
      {
        data: {},
        route: `${operatorId}/features/${id}/`,
      },
      {
        onSuccess: () => {
          message.success("Perk Deleted");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleUpdateFeature = (id: string, data: GeneralObject) => {
    updateFeature(
      {
        data: data,
        route: `${operatorId}/features/${id}/`,
      },
      {
        onSuccess: () => {
          message.success("Perk Updated");
          refetch();
          hideFeaturesSidebar();
          setSelectedFeature(null);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleFeatureClick = (id: string) => {
    setSelectedFeature(id);
    showFeaturesSidebar();
  };

  const handleSidebarClose = () => {
    setSelectedFeature(null);
    hideFeaturesSidebar();
  };

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Typography.Title level={5} className="text-zui-silver uppercase mb-3">
          Perks
        </Typography.Title>
        {allFeatures?.length ? (
          <Button
            onClick={showFeaturesSidebar}
            className="w-full md:w-auto mt-6"
            type="default"
            icon={<PlusOutlined />}
          >
            Add Amenity
          </Button>
        ) : null}
      </div>

      {allFeatures?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allFeatures.map((perk) => (
            <Card
              key={perk.id}
              onClick={handleFeatureClick.bind(null, perk.id)}
              className="hover:shadow-md transition-shadow"
              hoverable
              styles={{ body: { padding: "1rem" } }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <span className="text-2xl">{perk.icon}</span>
                <Typography.Text strong className="block">
                  {perk.name.substring(0, 30)}
                </Typography.Text>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  data-id={perk.id}
                  onClick={handleDeleteFeature}
                  className="absolute top-2 right-2"
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <Empty description="No perks added yet">
            <Button onClick={showFeaturesSidebar} type="default">
              Add Amenity
            </Button>
          </Empty>
        </div>
      )}

      <FeaturesSidebar
        isOpen={isFeaturesSidebarVisible}
        onClose={handleSidebarClose}
        onSave={saveFeatureHandler}
        onUpdate={handleUpdateFeature}
        selectedFeature={selectedFeature}
        containerId={operatorId}
        endpoint="CAS_OPERATORS"
      />
    </Space>
  );
};

export default HousePerks;
