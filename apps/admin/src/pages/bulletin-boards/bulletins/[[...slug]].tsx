import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { combineRouteAndQueryParams, isValidString } from "@zo/utils/string";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import { processResponseError } from "@zo/utils/auth";
import { Empty, Flex, Spin, Typography, message } from "antd";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  BulletinBulkUpload,
  AddBulletinSidebar,
} from "../../../components/sidebars";
import { TweetCard } from "../../../components/ui";
import {
  CASBulletinBoardResponse,
  CASBulletinsResponse,
} from "../../../config";

export default function Bulletins() {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug && Array.isArray(router.query.slug)) {
      const [board, uploadType] = router.query.slug;
      return {
        board,
        uploadType,
      };
    }
    return {
      board: null,
      uploadType: null,
    };
  }, [router.query]);

  const [allData, setAllData] = useState<GeneralObject[]>([]);

  const route = useMemo(() => {
    if (isValidString(router.query.slug?.[0])) {
      return `board=${router.query.slug?.[0]}&ordering=-created_at`;
    } else {
      return "";
    }
  }, [router.query]);

  const { data: boardDetails } = useQueryApi<CASBulletinBoardResponse>(
    "CAS_BULLETIN_BOARDS",
    {
      enabled: isValidString(router.query.slug?.[0]),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const { mutate } = useMutationApi("CAS_BULLETINS", {}, "", "PUT");

  const boardTitle = useMemo(() => {
    if (boardDetails && isValidString(boardDetails?.title)) {
      return boardDetails.title;
    } else {
      return "Bulletins";
    }
  }, [boardDetails]);

  const handleRowUpdate = (
    data: GeneralObject,
    action: "upsert" | "delete" = "upsert"
  ) => {
    setAllData((prev) => {
      if (action === "upsert") {
        const index = prev.findIndex((item) => item.id === data.id);
        if (index === -1) {
          return [data, ...prev];
        } else {
          prev[index] = { ...data };
          return [...prev];
        }
      } else {
        return [...prev.filter((item) => item.id !== data.id)];
      }
    });
  };

  const { isLoading: isLoadingTableData } = useInfiniteTable({
    name: "bulletins",
    setter: setAllData,
    queryEndpoint: "CAS_BULLETINS",
    customSearchQuery: route,
    enabled: isValidString(route),
  });

  const toggleStatus = (value: boolean, data: GeneralObject | undefined) => {
    if (data) {
      mutate(
        {
          data: { status: value ? "published" : "unpublished" },
          route: `${data.id}/`,
        },
        {
          onSuccess(data) {
            message.success("Updated successfully");
            handleRowUpdate(data.data, "upsert");
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  const handleAddClick = (type: "bulkupload" | "new") => {
    router.push(
      combineRouteAndQueryParams(`${router.asPath}/${type}`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleCloseSidebar = () => {
    router.push(
      combineRouteAndQueryParams(
        `/bulletin-boards/bulletins/${param.board}`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  return (
    <Page
      breadCrumbs={[
        { label: "Bulletin Boards", href: "/bulletin-boards" },
        { label: boardTitle, href: `${router.asPath}` },
      ]}
    >
      <PageHeader
        title="Bulletins"
        collapseButtons={false}
        buttons={[
          {
            icon: <UploadOutlinedIcon />,
            label: "Bulk Upload",
            onClick: handleAddClick.bind(null, "bulkupload"),
            type: "secondary",
          },
          {
            icon: <AddOutlinedIcon />,
            label: "Add Bulletin",
            onClick: handleAddClick.bind(null, "new"),
            type: "secondary",
          },
        ]}
      />

      <Spin spinning={isLoadingTableData} tip="Loading...">
        <div className="mt-4">
          <Typography.Text
            strong
            type="secondary"
            style={{ textTransform: "uppercase", fontSize: "16px" }}
          >
            Images
          </Typography.Text>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
            {allData?.filter((item) => item.type === "media").length > 0 ? (
              allData
                ?.filter(
                  (item) => item.type === "media" && item.media?.length > 0
                )
                .map((item: GeneralObject) => {
                  const isVideo = item.media[0]?.category === "video";
                  const url = item.media[0]?.url;

                  return isVideo ? (
                    <video
                      key={item.id}
                      className="w-full bg-zui-light aspect-square border border-zui-light hover:border-zui-silver cursor-pointer"
                      autoPlay
                      loop
                      muted
                      playsInline
                      src={url}
                    />
                  ) : (
                    <img
                      key={item.id}
                      alt="house Image"
                      className="w-full bg-zui-light aspect-square border border-zui-light hover:border-zui-silver cursor-pointer"
                      src={`${url}?w=200`}
                    />
                  );
                })
            ) : (
              <Flex justify="center" align="center" className="h-full">
                <Empty description="No Media Available" />
              </Flex>
            )}
          </div>

          <Typography.Text
            strong
            type="secondary"
            style={{ textTransform: "uppercase", fontSize: "16px" }}
          >
            Tweets
          </Typography.Text>

          {allData?.filter(
            (tweet) => tweet.type === "tweet" && isValidObject(tweet.content)
          ).length > 0 ? (
            <Flex vertical gap="16px" wrap="wrap" className="py-6">
              {allData.map((tweet) =>
                tweet.type === "tweet" && isValidObject(tweet.content) ? (
                  <TweetCard
                    data={tweet as CASBulletinsResponse}
                    onStatusChange={toggleStatus}
                  />
                ) : null
              )}
            </Flex>
          ) : (
            !isLoadingTableData && (
              <Flex justify="center" align="center" className="h-full py-6">
                <Empty description="No Fetched Tweets" />
              </Flex>
            )
          )}
        </div>
      </Spin>

      <BulletinBulkUpload
        isOpen={param.uploadType === "bulkupload"}
        onClose={handleCloseSidebar}
        boardId={param.board}
      />
      <AddBulletinSidebar
        isOpen={param.uploadType === "new"}
        onClose={handleCloseSidebar}
        boardId={param.board}
        onSuccess={handleRowUpdate}
      />
    </Page>
  );
}
