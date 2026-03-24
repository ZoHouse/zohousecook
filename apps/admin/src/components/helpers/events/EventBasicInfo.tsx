import { useMutationApi, useQueryApi } from "@zo/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Inventory, Node, ZoHouse } from "apps/admin/src/config";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";

import { PhotoOutlined } from "@mui/icons-material";
import { processResponseError } from "@zo/utils/auth";
import { areObjectsEqual } from "@zo/utils/object";
import { Flex, Typography, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import { Form, FormElement } from "../../Form";
import { MediaGallerySidebar } from "../../sidebars";
import CreateEventNodeSidebar from "../../sidebars/CreateEventNodeSidebar";
import CreateNewNodeButton from "./CreateNewNodeButton";

interface EventBasicInfoProps {
  eventId: string;
  saveButtonRef: React.MutableRefObject<(() => void) | undefined>;
}

const getCategoryDescription = (category: string) => {
  switch (category) {
    case "closed-irl":
      return "Offline event with registration requiring approval";
    case "open-irl":
      return "Offline event with open, auto-approved registration.";
    case "closed-virtual":
      return "Online event with registration requiring approval.";
    case "open-virtual":
      return "Online event with open, auto-approved registration.";
    case "listing":
      return "Display-only event on maps, not shown in event listings.";
    default:
      return "";
  }
};

const EventBasicInfo: React.FC<EventBasicInfoProps> = ({
  eventId,
  saveButtonRef,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();
  const eventCategory = useWatch("category", form);

  const [isNodeSidebarVisible, showNodeSidebar, hideNodeSidebar] =
    useVisibilityState();

  const [isMediaGalleryVisible, showMediaGallery, hideMediaGallery] =
    useVisibilityState(false);

  const { mutate: updateEvent } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );

  const { data, refetch } = useQueryApi<Inventory>(
    "CAS_INVENTORY",
    {
      enabled: isValidString(eventId),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${eventId}/`
  );

  const formattedData = useMemo(() => {
    if (data && eventId) {
      return {
        name: data.name,
        status: data.status,
        category: data.category,
        start_at: dayjs(data.start_at),
        description: data.description,
        end_at: dayjs(data.end_at),
        operator: data.operator,
        sort_index: data.sort_index,
        node: data.node?.id,
        hosts: data.hosts?.map((h) => ({
          value: h.host.id,
          label: h.host.nickname,
        })),
        "data.subcategory": data.data.subcategory,
        "data.price": data.data.price,
        "data.latitude": data.data.latitude,
        "data.location": data.data.location,
        "data.longitude": data.data.longitude,
        "data.navigation_link": data.data.navigation_link,
        "data.registration_link": data.data.registration_link,
        "data.link": data.data.link,
        "data.hosted_by": data.data.hosted_by,
        "data.email": data.data.email,
        "data.icon": data.data.icon,
      };
    } else {
      return {};
    }
  }, [data]);

  const { data: operatorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_OPERATORS", {
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.results.map((opeartor: ZoHouse) => ({
        label: opeartor.name,
        value: opeartor.id,
      })),
  });

  const { data: nodesOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_NODES",
    {
      enabled: true,
      select: (data) =>
        data.data.map((node: Node) => ({
          label: node.name,
          value: node.id,
        })),
    },
    "",
    "limit=-1"
  );

  const { data: categoryOptions } = useQueryApi<
    Array<{ label: string; value: string; hint: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.inventory.categories.experience.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
        hint: getCategoryDescription(item),
      }));
    },
  });

  const { data: subCategoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.inventory.subcategory.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Event Name",
      type: "text",
      required: true,
    },
    {
      name: "hosts",
      label: "Hosted By",
      type: "searchMultiSelect",
      searchQueryApi: "CAS_PROFILES",
      responseFields: [
        "id",
        "user",
        "nickname",
        "selected_nickname",
        "pfp",
        "pid",
        "first_name",
        "last_name",
        "email_address",
        "wallet_address",
        "avatar",
      ],
      optionValueAndLabelSelector: (data) => ({
        value: data.pid,
        label: data.nickname || data.first_name,
      }),
      options:
        data?.hosts?.map((h) => ({
          value: h.host.id,
          label: h.host.nickname,
        })) || [],
    },
    {
      name: "operator",
      label: "Operator",
      type: "select",
      options: operatorOptions || [],
      required: true,
    },
    {
      name: "node",
      label: "Node",
      type: "searchselect",
      searchQueryApi: "CAS_NODES",
      required: true,
      options: nodesOptions,
      notFoundContent: <CreateNewNodeButton onClick={showNodeSidebar} />,
    },
    {
      name: "status",
      label: "Status",
      type: "switch",
      switchToggleOptions: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      initialValue: "active",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: categoryOptions,
      required: true,
      optionRender: (option: {
        label: string;
        value: string;
        hint: string;
      }) => (
        <div className="">
          <span>{option.label}</span>
          <span className="text-xs text-zui-gray">{option.hint}</span>
        </div>
      ),
    },
    {
      name: "subcategory",
      label: "Sub Category",
      type: "select",
      options: subCategoryOptions,
      isHidden: eventCategory !== "listing",
    },
    {
      name: "link",
      label: "Event URL",
      type: "text",
      isHidden:
        eventCategory !== "open-virtual" && eventCategory !== "closed-virtual",
    },
    {
      name: "description",
      label: "About Event",
      type: "textarea",
      placeholder: "Event Description...",
      required: true,
    },
    {
      name: "start_at",
      label: "Starts At",
      type: "datetime",
      required: true,
    },
    {
      name: "end_at",
      label: "Ends At",
      type: "datetime",
      required: true,
    },

    {
      name: "data.price",
      label: "Price",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "data.location",
      label: "Location",
      type: "text",
    },
    {
      name: "data.latitude",
      label: "Latitude",
      type: "number",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "data.longitude",
      label: "Longitude",
      type: "number",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "data.navigation_link",
      label: "Navigation Link",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "data.registration_link",
      label: "Registration Link",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "data.icon",
      label: "Icon Link",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "sort_index",
      label: "Priority",
      type: "number",
      hint: "Larger Number Means Higher Priority",
    },
  ];

  const handleSave = () => {
    const formData = form.getFieldsValue(true);
    updateEvent(
      {
        data: { ...formData, node: formData.node },
        route: `${data?.id}/`,
      },
      {
        onSuccess() {
          message.success("Successfully updated");
          queryClient.invalidateQueries({
            queryKey: ["cas", "inventory"],
          });
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );

    if (data && formData.hosts) {
      const uniqueHosts = Array.from(new Set(formData.hosts));

      if (!areObjectsEqual(data.hosts, uniqueHosts)) {
        updateEvent(
          {
            data: {
              hosts: uniqueHosts,
            },
            route: `${data.id}/hosts/replace-all/`,
          },
          {
            onSuccess() {
              message.success("Hosts Updated");
              refetch();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    }
  };

  const mediaWithHighestPriority = data?.media?.sort(
    (a, b) => b.sort_index - a.sort_index
  )[0];

  useEffect(() => {
    if (saveButtonRef.current) {
      saveButtonRef.current = handleSave;
    }
  }, [handleSave]);

  return (
    <>
      <Flex gap="24px" className="mt-6">
        <Flex vertical className="flex-1 md:max-w-[50%]">
          <Typography.Text
            type="secondary"
            className="mb-4 text-base uppercase"
          >
            Basic Info
          </Typography.Text>
          <Form
            formFields={formFields}
            formData={form}
            initialValues={formattedData}
          />
        </Flex>

        <Flex className="flex-1">
          {mediaWithHighestPriority?.url ? (
            <div
              role="button"
              onClick={showMediaGallery}
              className="w-full aspect-video max-h-[180px] group relative rounded-md overflow-hidden"
            >
              <div className="flex items-center justify-center absolute top-0 left-0 w-full h-full bg-zui-dark opacity-0 group-hover:opacity-60 cursor-pointer transition-opacity duration-200 ease-out group-hover:border border-zui-lightest">
                Update Cover
              </div>
              <img
                src={`${mediaWithHighestPriority?.url}?w=600  `}
                alt="house Image"
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <Flex
              vertical
              align="center"
              justify="center"
              onClick={showMediaGallery}
              className="flex-1 relative w-full aspect-video bg-zui-light border border-dashed border-zui-silver rounded-md cursor-pointer max-h-[180px]"
            >
              <PhotoOutlined sx={{ color: "#5a5a5a" }} />
              <Typography.Text type="secondary" className="text-center mt-2">
                Upload Image <br /> Must be in Ratio 16:9
              </Typography.Text>
            </Flex>
          )}
        </Flex>
      </Flex>
      <MediaGallerySidebar
        isOpen={isMediaGalleryVisible}
        onClose={hideMediaGallery}
        relationTypeId={eventId}
        relationType="inventory"
        queryApi="CAS_INVENTORY"
      />

      <CreateEventNodeSidebar
        isOpen={isNodeSidebarVisible}
        onClose={hideNodeSidebar}
        onSuccess={() => {
          form.setFieldValue("node", form.getFieldValue("node"));
        }}
      />
    </>
  );
};

export default EventBasicInfo;
