import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../../Form";
import { PageContent, PageHeader } from "../../ui2";

interface TripsBasicInfoProps {
  data: GeneralObject;
  refetch?: () => void;
}

const TripBasicInfo: React.FC<TripsBasicInfoProps> = ({ data, refetch }) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { mutate: updateTrip } = useMutationApi("CAS_INVENTORY", {}, "", "PUT");
  const { refetch: refetchTags } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_TAGS",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      select(data) {
        return data.data.map((tag: GeneralObject) => ({
          label: formatCapitalize(tag.slug),
          value: tag.slug,
        }));
      },
    },
    "",
    "limit=-1"
  );

  const tripBasicInfoData = useMemo(
    () => ({
      name: data?.name,
      status: data?.status || "inactive",
      whatsapp_number: data?.data?.whatsapp_number || "",
      tags: data?.tags?.map((tag: string) => tag.toLowerCase()) || [],
    }),
    [data]
  );

  useEffect(() => {
    form.setFieldsValue(tripBasicInfoData);
  }, [form, tripBasicInfoData]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        tags: Array.isArray(values.tags) ? values.tags : [],
        data: {
          whatsapp_number: values.whatsapp_number,
        },
      };

      const route = `${data.id}/`;
      updateTrip(
        { data: payload, route: route },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "inventory"],
            });
            message.success("Basic Info updated successfully");
            refetch?.();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const formFields: FormElement[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },

    {
      name: "whatsapp_number",
      label: "Whatsapp Number",
      type: "text",
    },

    {
      name: "tags",
      label: "Tags",
      type: "searchableTagInput",
      searchQueryApi: "CAS_TAGS",
      createMutationApi: "CAS_TAGS",
      placeholder: "Search tags or create new ones (press Enter/comma)",
      className: "w-full",
      optionValueAndLabelSelector: (data: GeneralObject) => ({
        value: data.slug,
        label: formatCapitalize(data.slug),
      }),
      onTagCreated: () => refetchTags(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Basic Info"
        rightOptions={
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        }
      />
      <PageContent>
        <Form formData={form} formFields={formFields} />
      </PageContent>
    </div>
  );
};

export default TripBasicInfo;
