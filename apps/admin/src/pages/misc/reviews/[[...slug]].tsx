import { useQueryApi } from "@zo/auth";
import { User } from "@zo/definitions/auth";
import { UserMini } from "@zo/moal";
import { cn } from "@zo/utils/font";
import { formatCapitalize, shortenString } from "@zo/utils/string";
import { Image, Rate, Tag, Tooltip } from "antd";
import { Media } from "apps/admin/src/config/typings";
import moment from "moment";
import { NextPage } from "next";
import { useMemo } from "react";
import { GeneralObject } from "@zo/definitions/general";
import {
  Zud,
  ZudColumnType,
  ZudDetailsMiniDataType,
  ZudFilterOptionType,
} from "@zo/zud";
import EventIcon from "@mui/icons-material/Event";
import ChatIcon from "@mui/icons-material/Chat";
import LinkIcon from "@mui/icons-material/Link";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DescriptionIcon from "@mui/icons-material/Description";
import HouseIcon from "@mui/icons-material/House";
import ImageIcon from "@mui/icons-material/Image";

const ReviewPage: NextPage = () => {
  const { data: categoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_REVIEW_CATEGORIES",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((category: GeneralObject) => ({
          label: category.name,
          value: String(category.id),
        })),
    },
    "",
    "limit=-1"
  );

  const orderingOptions = useMemo(() => {
    return [
      { label: "Latest", value: "-created_at" },
      { label: "Oldest", value: "created_at" },
      { label: "Highest Rating", value: "-rating" },
      { label: "Lowest Rating", value: "rating" },
    ];
  }, []);

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Guest",
        dataIndex: "user",
        key: "user",
        width: "240px",
        render: (cell) => <UserMini data={cell as User} />,
      },
      {
        title: "Rating",
        dataIndex: "rating",
        key: "rating",
        render: (cell) => {
          return (
            <div className="flex">
              <Tooltip title={`${cell} out of 10`}>
                <Rate allowHalf disabled defaultValue={cell / 2} />
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: "Comment",
        dataIndex: "comment",
        key: "comment",
        render: (cell) =>
          cell && cell?.length > 100
            ? cell?.slice(0, 100) + "..."
            : cell || "N/A",
        width: "240px",
      },
      {
        title: "Operator",
        dataIndex: "operator",
        key: "operator",
        render: (cell) => cell?.name || "N/A",
      },
      {
        title: "Categories",
        dataIndex: "segments",
        key: "segments",
        width: "240px",
        render: (cell) => (
          <div className="flex flex-wrap gap-1">
            {cell?.map((segment: any) => (
              <Tag bordered={false} color="volcano" key={segment.id}>
                {segment.category.name}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: "Created At",
        dataIndex: "created_at",
        key: "created_at",
        render: (cell) => (
          <Tooltip title={moment(cell).format("LLL")}>
            <span>{moment(cell).format("DD/MM/YYYY")}</span>
          </Tooltip>
        ),
      },
    ],
    []
  );

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/reviews", label: "Reviews" },
  ];

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "segments__category",

        className: "w-fit md:w-48",
        placeholder: "SegmentCategory",
        options: [
          {
            label: "All Categories",
            value: "null",
          },
          ...(categoryOptions || []),
        ],
      },
      {
        type: "ordering",
        key: "ordering",
        placeholder: "Sort By",
        className: "w-fit md:w-48",
        defaultValue: "created_at",
        options: orderingOptions,
      },
      {
        type: "date_range",
        key: "date_range",
        startKey: "created_at__gte",
        endKey: "created_at__lte",
        fromLabel: "Created From",
        toLabel: "Created To",
      },
    ],
    [categoryOptions, orderingOptions]
  );

  const detailsMini: ZudDetailsMiniDataType = useMemo(
    () => ({
      userKey: "user",
      dataList: [
        {
          id: "rating",
          dataKey: "",
          title: "Rating",
          data: [
            {
              id: "rating",
              dataKey: "rating",
              label: "Rating",
              content: (item: GeneralObject, data?: GeneralObject) => (
                <Tooltip title={`${item} out of 10`}>
                  <Rate allowHalf disabled defaultValue={Number(item) / 2} />
                </Tooltip>
              ),
              isHidden: (item: GeneralObject, data?: GeneralObject) => !item,
              icon: <EventIcon />,
            },
            {
              id: "comment",
              label: "Comment",
              dataKey: "comment",
              isHidden: (item: GeneralObject, data?: GeneralObject) => !item,
              content: (item: GeneralObject, data?: GeneralObject) =>
                String(item || "N/A"),
              icon: <ChatIcon />,
            },
            {
              id: "operator",
              dataKey: "operator",
              label: "Operator",
              content: (item: GeneralObject, data?: GeneralObject) =>
                String(item?.name || "N/A"),
              isHidden: (item: GeneralObject, data?: GeneralObject) => !item,
              icon: <HouseIcon />,
            },
            {
              id: "source",
              dataKey: "source",
              label: "Source",
              content: (item: GeneralObject, data?: GeneralObject) =>
                formatCapitalize(String(item || "N/A")),
              icon: <LinkIcon />,
            },
            {
              id: "booking_ref_id",
              dataKey: "booking_ref_id",
              label: "Booking Ref ID",
              content: (item: GeneralObject, data?: GeneralObject) =>
                shortenString(String(item), 10) || "N/A",
              icon: <MenuBookIcon />,
              copyText: (item: GeneralObject, data?: GeneralObject) =>
                String(item),
            },
            {
              id: "created_at",
              dataKey: "created_at",
              label: "Created At",
              content: (item: GeneralObject, data?: GeneralObject) => (
                <Tooltip title={moment(item).format("LLL")}>
                  <span>{moment(item).calendar()}</span>
                </Tooltip>
              ),
              icon: <AccessTimeIcon />,
            },
            {
              id: "updated_at",
              dataKey: "updated_at",
              label: "Updated At",
              content: (item: GeneralObject, data?: GeneralObject) => (
                <Tooltip title={moment(item).format("LLL")}>
                  <span>{moment(item).calendar()}</span>
                </Tooltip>
              ),
              icon: <AccessTimeIcon />,
            },
          ],
        },
        {
          id: "segments",
          dataKey: "category",
          title: "Segments",
          isHidden: (item: GeneralObject, data?: GeneralObject) =>
            data?.segments?.length === 0,
          data: [
            {
              id: "segments",
              dataKey: "segments",
              isHidden: (item: GeneralObject, data?: GeneralObject) =>
                data?.segments?.length === 0,
              content: (item: GeneralObject, data?: GeneralObject) => {
                if (!data?.segments?.length) return "-";

                return (
                  <ul className="flex flex-col gap-2">
                    {data.segments.map((segment: any, index: number) => (
                      <li
                        key={segment.id}
                        className={cn(
                          "flex flex-col items-start gap-2",
                          index !== 0 && "mt-4"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {segment.category.name}:{" "}
                          <Tooltip title={`${segment.rating} out of 10`}>
                            <Rate
                              allowHalf
                              disabled
                              defaultValue={Number(segment.rating) / 2}
                            />
                          </Tooltip>
                        </span>

                        <span className="text-sm text-gray-500">
                          ({segment.comment || "No comment"})
                        </span>

                        {segment.media?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {segment.media.map((media: Media) => (
                              <div key={media.id} className="relative">
                                <Image
                                  src={media.url}
                                  alt={media.metadata.alt || "Segment media"}
                                  preview={{
                                    title: media.metadata.title,
                                  }}
                                  width={96}
                                  height={96}
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              },
              icon: <DescriptionIcon />,
            },
          ],
        },
        {
          id: "media",
          dataKey: "media",
          title: "Media",
          data: [
            {
              id: "media",
              dataKey: "media",
              content: (item: GeneralObject, data?: GeneralObject) => {
                if (!data?.media?.length) return "No media available";

                return (
                  <div className="flex flex-wrap gap-2">
                    {data.media.map((media: Media) => (
                      <div key={media.id} className="relative">
                        <Image
                          src={media.url}
                          alt={media?.metadata?.alt || "Review media"}
                          preview={{
                            title: media?.metadata?.title,
                          }}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                );
              },
              icon: <ImageIcon />,
            },
          ],
        },
      ],
    }),
    []
  );

  return (
    <Zud
      name="review"
      title="Reviews"
      columns={columns}
      breadCrumbs={breadcrumbs}
      queryEndpoint="CAS_REVIEWS"
      mutationEndpoint="CAS_REVIEW_CATEGORIES"
      filterOptions={filterOptions}
      detailsMini={detailsMini}
      customSearchQuery="ordering=-created_at"
      searchable
    />
  );
};

export default ReviewPage;
