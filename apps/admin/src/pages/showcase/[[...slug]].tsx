import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader } from "@zo/moal";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
  isValidUUID,
} from "@zo/utils/string";
import { Alert, Empty, Flex, Select, Spin, Typography } from "antd";
import {
  Estate,
  Floor,
  ShowcaseDisplay,
  ShowcaseSession,
} from "apps/admin/src/config";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { ShowcaseCard } from "../../components/helpers/showcase";
import {
  ShowcaseDisplaySidebar,
  ShowcaseSessionSidebar,
} from "../../components/sidebars";

/**
 * Showcase page component that displays and manages showcase sessions and displays
 * Allows filtering by estate and status, and creating new sessions/displays
 */
const ShowcasePage: NextPage = () => {
  const router = useRouter();

  // Parse and structure URL parameters
  const routeParams = useMemo(() => {
    const selectedEstate = router.query.estate as string;
    const selectedStatus = router.query.status || ("active" as string);

    if (router.query.slug && Array.isArray(router.query.slug)) {
      const [showcaseElement, Id] = router.query.slug;
      return {
        showcaseElement,
        sessionId: showcaseElement === "session" && isValidUUID(Id) ? Id : null,
        estate: selectedEstate,
        status: selectedStatus,
        isCreatingNewElement: Id === "new",
        displayId: showcaseElement === "display" && isValidUUID(Id) ? Id : null,
      };
    }

    return {
      showcaseElement: null,
      isCreatingNewElement: false,
      sessionId: null,
      displayId: null,
      estate: selectedEstate,
      status: selectedStatus,
    };
  }, [router.query]);

  // Fetch displays for selected estate
  const {
    data: displayList,
    isLoading: isDisplayLoading,
    refetch: refetchDisplayList,
  } = useQueryApi<ShowcaseDisplay[]>(
    "CAS_SHOWCASE_DISPLAY",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    "",
    routeParams.estate
      ? `space_floor_estate=${routeParams.estate}&limit=-1`
      : "limit=-1"
  );

  // Fetch estate options for dropdown
  const { data: estateOptions, isLoading: isEstateOptionsLoading } =
    useQueryApi<Array<{ label: string; value: string }>>(
      "CAS_ESTATES",
      {
        refetchOnWindowFocus: false,
        select: (data) =>
          data.data.map((estate: Estate) => ({
            label: estate.name,
            value: estate.id,
          })),
      },
      "",
      "limit=-1"
    );

  // Fetch status options for dropdown
  const { data: statusOptions, isLoading: isStatusOptionsLoading } =
    useQueryApi<Array<{ label: string; value: string }>>("CAS_SEED", {
      enabled: true,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.display_session?.status.map((status: string) => ({
          label: formatCapitalize(status),
          value: status,
        })) || [],
    });

  // Fetch sessions based on selected filters
  const {
    data: sessionList,
    isLoading: isSessionLoading,
    refetch: refetchSessionList,
  } = useQueryApi<ShowcaseSession[]>(
    "CAS_SHOWCASE_DISPLAY_SESSION",
    {
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    `${
      routeParams.estate
        ? `display__space__floor__estate=${routeParams.estate}`
        : ""
    }&limit=-1&${routeParams.status ? `status=${routeParams.status}` : ""}`
  );

  // Extract showcase type IDs from sessions
  const showcaseTypeIds = useMemo(() => {
    const types = [
      "profile",
      "collected",
      "artist",
      "promotional",
      "estate",
      "space",
    ];
    return types.reduce((acc, type) => {
      acc[type] = (sessionList ?? [])
        .filter((session) => session?.showcase_type === type)
        .map((session) => session?.data?.filter_ids ?? [])
        .flat()
        .filter((id): id is string => id !== undefined);
      return acc;
    }, {} as Record<string, string[]>);
  }, [sessionList]);

  // Fetch details for each showcase type
  const { data: profileDetails, isLoading: isProfileLoading } = useQueryApi<
    Floor[]
  >(
    "CAS_SHOWCASE_PROFILE",
    {
      select: (data) => data.data,
      enabled: showcaseTypeIds.profile?.length > 0,
      refetchOnWindowFocus: false,
    },
    "",
    `ids=${showcaseTypeIds.profile?.join(",")}&limit=-1`
  );

  const { data: collectedDetails, isLoading: isCollectedLoading } = useQueryApi<
    Floor[]
  >(
    "CAS_SHOWCASE_USERS",
    {
      select: (data) => data.data,
      enabled: showcaseTypeIds.collected?.length > 0,
      refetchOnWindowFocus: false,
    },
    "",
    `ids=${showcaseTypeIds.collected?.join(",")}&limit=-1`
  );

  const { data: artistDetails, isLoading: isArtistLoading } = useQueryApi<
    Floor[]
  >(
    "CAS_SHOWCASE_ARTISTS",
    {
      select: (data) => data.data,
      enabled: showcaseTypeIds.artist?.length > 0,
      refetchOnWindowFocus: false,
    },
    "",
    `ids=${showcaseTypeIds.artist?.join(",")}&limit=-1`
  );

  const { data: promotionalDetails, isLoading: isPromotionalLoading } =
    useQueryApi<Floor[]>(
      "CAS_SHOWCASE_PROMOTIONAL",
      {
        select: (data) => data.data,
        enabled: showcaseTypeIds.promotional?.length > 0,
        refetchOnWindowFocus: false,
      },
      "",
      `ids=${showcaseTypeIds.promotional?.join(",")}&limit=-1`
    );

  const detailsMap = useMemo(
    () => ({
      profile: profileDetails,
      collected: collectedDetails,
      artist: artistDetails,
      promotional: promotionalDetails,
      estate: [],
      space: [],
    }),
    [profileDetails, collectedDetails, artistDetails, promotionalDetails]
  );
  /**
   * Get details for a specific showcase type and filter by IDs
   */
  const getShowcaseTypeDetails = (showcaseType: string, ids: string[]) => {
    return (
      (detailsMap[showcaseType as keyof typeof detailsMap]?.filter((detail) =>
        ids?.includes(detail.id)
      ) as GeneralObject[]) || null
    );
  };

  // Group sessions by space and enrich with related data
  const sessionsBySpace = useMemo(() => {
    const enrichedDisplayList = displayList?.map((display: ShowcaseDisplay) => {
      const space = display.space;
      const floor = space?.floor;
      const estate = floor?.estate;

      const session = sessionList?.filter(
        (session: ShowcaseSession) => session.display.id === display.id
      );

      const showcase = Array.from(
        new Set(
          session?.map((session: ShowcaseSession) => {
            const showcaseTypeDetails = getShowcaseTypeDetails(
              session.showcase_type,
              session.data.filter_ids
            );

            // Get first item from array since we only need one showcase
            return showcaseTypeDetails;
          })
        )
      ).flat();

      return {
        ...display,
        space,
        floor,
        estate,
        session,
        showcase,
      };
    });

    // Group sessions by space name
    const groupedBySpace = enrichedDisplayList?.reduce((acc, session) => {
      const spaceName = session.space?.name;
      if (!spaceName) return acc;

      if (!acc[spaceName]) {
        acc[spaceName] = [];
      }
      acc[spaceName].push(session);
      return acc;
    }, {} as Record<string, GeneralObject>);

    return groupedBySpace;
  }, [displayList, sessionList, detailsMap]);

  /**
   * Navigate to create new display page
   */
  const handleCreateDisplay = () => {
    router.push(
      combineRouteAndQueryParams("/showcase/display/new", router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  /**
   * Handle closing of sidebars
   */
  const handleClose = () => {
    const newQuery = { ...router.query };
    delete newQuery.space;
    delete newQuery.display;

    router.push(
      combineRouteAndQueryParams("/showcase", {
        ...newQuery,
        estate: routeParams.estate,
      }),
      undefined,
      {
        shallow: true,
      }
    );
  };

  /**
   * Handle filter changes (estate/status)
   */
  const handleFilterChange = (filterKey: string, filterValue: string) => {
    const newQuery = { ...router.query };
    if (filterValue && filterValue !== "all") {
      newQuery[filterKey] = filterValue;
    } else {
      delete newQuery[filterKey];
    }
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const refetch = () => {
    refetchDisplayList();
    refetchSessionList();
  };

  const isLoading =
    isDisplayLoading ||
    isEstateOptionsLoading ||
    isStatusOptionsLoading ||
    isSessionLoading ||
    isProfileLoading ||
    isCollectedLoading ||
    isArtistLoading ||
    isPromotionalLoading;

  return (
    <Page breadCrumbs={[{ href: "/showcase", label: "Showcase" }]}>
      <PageHeader
        collapseButtons
        title="All Displays"
        buttons={[
          {
            label: "New Display",
            onClick: handleCreateDisplay,
            icon: <DevicesOutlinedIcon />,
            type: "secondary",
          },
        ]}
      />

      <Flex justify="start" align="center" className="my-6 md:my-10" gap={16}>
        <Select
          className="w-48"
          placeholder="Estate"
          size="large"
          options={estateOptions || []}
          onChange={(value) => handleFilterChange("estate", value)}
          value={routeParams.estate}
          loading={isEstateOptionsLoading}
        />
        <Select
          className="w-48"
          placeholder="Status"
          size="large"
          options={statusOptions || []}
          onChange={(value) => handleFilterChange("status", String(value))}
          value={routeParams.status}
          loading={isStatusOptionsLoading}
        />
      </Flex>

      {!isValidString(routeParams.estate) && (
        <Alert
          showIcon
          className="w-full md:w-1/2"
          message="Please select an estate to view sessions"
          type="info"
        />
      )}

      {routeParams.estate && (
        <Spin spinning={isLoading} size="large">
          {sessionList && sessionList?.length > 0 ? (
            <Flex vertical className="py-6" gap={40}>
              {sessionsBySpace &&
                Object.keys(sessionsBySpace as GeneralObject)?.map(
                  (spaceName, index, sessions) => (
                    <div key={spaceName}>
                      <Flex vertical gap={4}>
                        <Typography.Text
                          style={{
                            textTransform: "uppercase",
                            fontSize: "16px",
                          }}
                        >
                          {spaceName}
                        </Typography.Text>
                        <Flex
                          className="text-sm text-zui-silver whitespace-nowrap w-fit"
                          wrap="wrap"
                          align="center"
                          gap={4}
                        >
                          <span>
                            {sessionsBySpace?.[spaceName][0].floor?.name}
                          </span>
                          <ArrowForwardOutlinedIcon fontSize="small" />
                          <span>
                            {sessionsBySpace?.[spaceName][0].space?.name}
                          </span>
                        </Flex>
                      </Flex>

                      <Flex
                        justify="start"
                        align="center"
                        gap={16}
                        wrap="wrap"
                        className="mt-6"
                      >
                        {Array.isArray(sessionsBySpace?.[spaceName]) &&
                          sessionsBySpace?.[spaceName].map(
                            (display: GeneralObject) => {
                              return (
                                display && (
                                  <ShowcaseCard
                                    key={display.id}
                                    display={display}
                                    selected={
                                      routeParams.displayId === display.id
                                    }
                                  />
                                )
                              );
                            }
                          )}
                      </Flex>
                    </div>
                  )
                )}
            </Flex>
          ) : (
            <Flex justify="center" align="center" className="py-6">
              <Empty description="No sessions found" />
            </Flex>
          )}
        </Spin>
      )}

      <ShowcaseDisplaySidebar
        open={
          (routeParams.showcaseElement === "display" &&
            isValidUUID(routeParams.displayId)) ||
          routeParams.isCreatingNewElement
        }
        onClose={handleClose}
        displayId={routeParams.displayId}
        refetch={refetch}
      />

      <ShowcaseSessionSidebar
        open={
          routeParams.showcaseElement === "session" &&
          (isValidUUID(routeParams.sessionId) ||
            routeParams.isCreatingNewElement)
        }
        sessionId={routeParams.sessionId}
        onClose={handleClose}
        refetch={refetch}
      />
    </Page>
  );
};

export default ShowcasePage;
