import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Statistic, useInfiniteTable } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { CheckinInfoSidebar } from "../../components/sidebars";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";

const WebCheckins: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("front-desk-manager");
  const router = useRouter();

  const [data, setData] = useState<GeneralObject[]>([]);

  const breadCrumbs = [
    {
      text: "Future Web Check-ins",
      to: "/web-checkins",
    },
  ];

  const {
    data: selectedCheckin,
    refetch: refetchSelectedCheckin,
    isLoading: isLoadingSelectedCheckin,
    isRefetching: isRefetchingSelectedCheckin,
  } = useQueryApi<GeneralObject>(
    "ADMIN_PM_CHECKIN",
    {
      enabled: isValidString(router.query.slug?.[0]) && canView,
      select: (data) => data?.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const hideSelectedCheckin = () => {
    router.push("/web-checkins", undefined, { shallow: true });
  };

  const handleRowClick = (row: GeneralObject) => {
    router.push(`/web-checkins/${row.id}`, undefined, {
      shallow: true,
    });
  };

  const refetchAndUpdateCheckin = () => {
    setTimeout(async () => {
      const { data: newSelectedCheckin } = await refetchSelectedCheckin();
      setData((prev) =>
        prev.map((b) =>
          b.id === selectedCheckin?.id ? { ...newSelectedCheckin } : b
        )
      );
    }, 500);
  };

  const { isLoading, reset, count } = useInfiniteTable({
    setter: setData,
    enabled: isValidObject(selectedOperator) && canView,
    queryEndpoint: "ADMIN_PM_CHECKIN",
    customSearchQuery: `operator=${
      selectedOperator?.id
    }&arrival_on_after=${moment()
      .subtract(1, "day")
      .format("YYYY-MM-DD")}&ordering=arrival_on&approved=0`,
    name: "arriving",
  });

  useEffect(() => {
    if (isValidObject(selectedOperator)) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperator]);

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Guest Name",
        dataIndex: "first_name",
        key: "first_name",
        render: (_: GeneralObject, data: GeneralObject) =>
          `${data?.profile.first_name} ${data?.profile.last_name || ""}`,
      },
      {
        title: "Status",
        dataIndex: "web_status",
        key: "web_status",
        render: (_: GeneralObject, data: GeneralObject) => (
          <div className="flex items-center gap-2 w-10 justify-center">
            <Icon
              name={data?.approved ? "Check" : "Clock"}
              size="16"
              fill={data?.approved ? "#66DF48" : "rgb(255,158,76)"}
            />
          </div>
        ),
      },
      {
        title: "Booking Code",
        dataIndex: "booking_code",
        key: "booking_code",
        render: (_: GeneralObject, data: GeneralObject) =>
          data?.booking?.code || "N/A",
      },
      {
        title: "Check-in → Check-out",
        dataIndex: "checkins",
        key: "checkins",
        render: (_: GeneralObject, data: GeneralObject) => (
          <div className="w-36 flex items-center gap-2">
            <span>{moment(data?.arrival_on).format("DD MMM")}</span>
            <span>→</span>
            <span>{moment(data?.departure_on).format("DD MMM")}</span>
          </div>
        ),
      },
    ],
    []
  );

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page breadCrumbs={breadCrumbs}>
      <PageHeader title="Future Web Check-ins" />
      <PageContent>
        <div className="flex justify-between space-x-6 mb-6">
          <Statistic label="Unapproved Check-ins" value={count} />
        </div>
        <ZudTable
          data={data}
          isLoading={isLoading}
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={handleRowClick}
        />
      </PageContent>

      <CheckinInfoSidebar
        isOpen={isValidString(router.query.slug?.[0])}
        isLoadingCheckin={isLoadingSelectedCheckin}
        isRefetchingCheckin={isRefetchingSelectedCheckin}
        checkin={selectedCheckin || {}}
        onClose={hideSelectedCheckin}
        refetchCheckin={refetchAndUpdateCheckin}
      />
    </Page>
  );
};

export default WebCheckins;
