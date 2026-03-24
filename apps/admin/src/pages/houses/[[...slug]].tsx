import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState, useWindowSize } from "@zo/utils/hooks";
import { combineRouteAndQueryParams, isValidString } from "@zo/utils/string";
import { Card, Col, Row, Spin, Statistic } from "antd";
import Meta from "antd/es/card/Meta";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AddHouseSidebar, HouseInfoSidebar } from "../../components/sidebars";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/21b93ca1-1443-4d6c-b053-84b6fe2b1eac_20241121125632.svg";

const House: NextPage = () => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const [isAddHouseVisible, showAddHouse, hideAddHouse] =
    useVisibilityState(false);
  const [isHouseInfoVisible, showHouseInfo, hideHouseInfo] =
    useVisibilityState(false);

  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);

  const [data, setData] = useState<GeneralObject[]>([]);

  const { isLoading, count, refetch } = useInfiniteTable({
    name: "operator",
    queryEndpoint: "CAS_OPERATORS",
    setter: setData,
    customSearchQuery: "ordering=-created_at",
  });

  const { data: numberOfCities } = useQueryApi<number>("CAS_DESTINATIONS", {
    refetchOnWindowFocus: false,
    select: (data) => +data.data.count,
  });

  const handleHouseSelect = (opeartorId: string) => {
    setSelectedOperator(opeartorId);
    showHouseInfo();
    router.push(`${opeartorId}/edit`, undefined, { shallow: true });
  };

  const handleHouseInfoClose = () => {
    setSelectedOperator(null);
    hideHouseInfo();
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleAddClick = () => {
    showAddHouse();
    router.push("new", undefined, { shallow: true });
  };

  const handleAddHouseClose = () => {
    hideAddHouse();
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    const slug = router.query.slug?.[0];
    if (slug == "new") {
      showAddHouse();
    }

    if (isValidString(slug) && router.query.slug?.[1] === "edit") {
      setSelectedOperator(String(slug));
      showHouseInfo();
    }
  }, [router.query]);

  return (
    <Page>
      <PageHeader
        title="Zo House"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Zo House",
            onClick: handleAddClick,
            type: "secondary",
          },
        ]}
      />

      <Row className="mt-4 py-6" gutter={32}>
        <Col span={12} md={6} lg={4}>
          <Statistic
            title="Total Zo Houses"
            value={count || 0}
            className="whitespace-nowrap"
          />
        </Col>
        <Col span={12} md={6} lg={4}>
          <Statistic
            title="Cities"
            value={numberOfCities || 0}
            className="whitespace-nowrap"
          />
        </Col>
      </Row>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap items-start gap-4 py-6">
        {data?.map((house: GeneralObject) => {
          const imageUrl =
            house.media?.length > 0
              ? `${house.media[0]?.url}?w=400`
              : DEFAULT_IMAGE;

          return (
            <Card
              key={house.id}
              hoverable
              onClick={() => handleHouseSelect(house.id)}
              className="aspect-square w-full xl:w-[280px] border-zui-light hover:border-zui-neon"
              cover={
                <div className="bg-transparent overflow-hidden h-40 md:h-[200px]">
                  <img
                    alt="house Image"
                    src={imageUrl}
                    className="w-full h-full object-cover p-[1px]"
                  />
                </div>
              }
            >
              <Meta title={house.name} description={house.destination.name} />
            </Card>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center my-6">
          <Spin />
        </div>
      )}

      <HouseInfoSidebar
        opeartorId={selectedOperator}
        isOpen={isHouseInfoVisible}
        onClose={handleHouseInfoClose}
      />
      <AddHouseSidebar
        isOpen={isAddHouseVisible}
        onClose={handleAddHouseClose}
        refetch={refetch}
      />
    </Page>
  );
};

export default House;
