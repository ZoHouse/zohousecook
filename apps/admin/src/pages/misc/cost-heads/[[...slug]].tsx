import { PlusOutlined } from "@ant-design/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageContent, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Button, Empty, Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { AddCostHeadSidebar } from "../../../components/sidebars";

const CostHead: NextPage = () => {
  const { Title } = Typography;
  const router = useRouter();

  const [trips, setTrips] = useState<GeneralObject[]>([]);
  const [isAddCostHeadVisible, showAddCostHead, hideAddCostHead] =
    useVisibilityState();

  const { mutate: updateList } = useMutationApi(
    "CAS_COST_HEADS",
    {},
    "",
    "PUT"
  );

  const { refetch, isLoading } = useInfiniteTable({
    setter: setTrips,
    queryEndpoint: "CAS_COST_HEADS",
    customSearchQuery: `type=cost-head`,
    name: "cost-heads",
  });

  // Table columns
  const columns: ColumnsType<GeneralObject> = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        width: 120,
        render: (name: any) => (isValidString(name) ? name : "-"),
      },
      {
        title: "Individual",
        dataIndex: "individual",
        key: "individual",
        width: 120,
        render: (individual: any) => (individual === 1 ? "Yes" : "No"),
      },
    ],
    []
  );

  const handleOnClose = () => {
    hideAddCostHead();
    router.replace("/misc/cost-heads", undefined, { shallow: true });
  };

  const handleAddCostHead = () => {
    showAddCostHead();
    router.push("/misc/cost-heads/new", undefined, { shallow: true });
  };

  return (
    <Page>
      <header className="md:ml-0 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <Title level={5} className="text-zui-silver uppercase">
            Cost Heads
          </Title>
        </div>
        <div className="flex space-x-6">
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={handleAddCostHead}
            className="my-6"
          >
            Add Cost Head
          </Button>
        </div>
      </header>

      <PageContent>
        <Table
          columns={columns}
          dataSource={trips || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: true }}
          className="w-full"
          loading={{
            indicator: <Loader className="w-5 h-5" />,
            spinning: isLoading,
          }}
          locale={{
            emptyText: <Empty description="No Cost Heads found" />,
          }}
        />
      </PageContent>

      <AddCostHeadSidebar
        isOpen={isAddCostHeadVisible}
        onClose={handleOnClose}
        refetch={refetch}
      />
    </Page>
  );
};

export default CostHead;
