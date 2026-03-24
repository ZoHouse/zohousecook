import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button } from "antd";
import { useForm } from "antd/es/form/Form";
import { Currency } from "apps/admin/src/config";
import { Operator } from "apps/admin/src/config/typings";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { PartnerImages } from ".";
import { Form, FormElement } from "../../Form";
import { PageContent, PageHeader } from "../../ui2";

interface PartnerBasicInfoProps {
  data: Operator;
  refetch: () => void;
}

const PartnerBasicInfo: React.FC<PartnerBasicInfoProps> = ({
  data,
  refetch,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();

  const { message } = App.useApp();

  const { data: currencyOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_CURRENCY",
    {
      enabled: isValidObject(data),
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((estate: Currency) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=-1"
  );

  const { mutate: updatePartner } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "PUT"
  );

  // const { data: taxOptions } = useQueryApi<
  //   Array<{ label: string; value: string }>
  // >("CAS_SEED", {
  //   refetchOnWindowFocus: false,
  //   select: (data) => {
  //     return data.data.taxation.applicable_taxes.map((item: string) => ({
  //       label: formatCapitalize(item),
  //       value: item,
  //     }));
  //   },
  // });

  const { data: categoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.operator.category.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const partnerInitialData = useMemo(() => {
    if (data) {
      return {
        destination: data?.destination?.id,
        name: data?.name,
        email: data?.email,
        address: data?.address,
        currency: data?.currency?.id,
        tagline: data?.tagline,
        alt_name: data?.alt_name,
        phone: data?.phone,
        status: data?.status,
        description: data?.description,
        coordinates: data?.coordinates,
      };
    } else {
      return {};
    }
  }, [data]);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
      };

      updatePartner(
        {
          data: payload,
          route: `${data.id}/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "operators"],
            });
            message.success("Partner Info Updated!");
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  }, [
    form,
    partnerInitialData,
    data.id,
    updatePartner,
    refetch,
    message,
    queryClient,
  ]);

  useEffect(() => {
    if (data && isValidObject(data)) {
      form.setFieldsValue(partnerInitialData);
    }
  }, [data]);

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "coordinates",
      label: "Coordinates",
      type: "coordinates",
      required: true,
    },
    {
      name: "destination",
      label: "City",
      type: "searchselect",
      searchQueryApi: "CAS_DESTINATIONS",
      required: true,
      selectedValueSelector(data) {
        return data?.name;
      },
      options: [
        { label: data?.destination?.name, value: data?.destination?.id },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },

    {
      name: "alt_name",
      label: "Alt Name",
      type: "text",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: true,
    },
    {
      name: "tagline",
      label: "Tagline",
      type: "textarea",
    },
    {
      name: "currency",
      label: "Currency",
      type: "select",
      options: currencyOptions,
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "phone",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: categoryOptions,
    },
    // {
    //   name: "tax",
    //   label: "Tax",
    //   type: "select",
    //   options: taxOptions,
    // },
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
        <div className="flex flex-col h-full">
          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto py-6 w-full">
            <section className="w-full md:w-2/5 flex-grow">
              <h2 className="text-zui-silver uppercase font-semibold mb-4">
                Partner Basic Info
              </h2>
              <Form
                formFields={formFields}
                formData={form}
                initialValues={partnerInitialData}
              />
            </section>

            <section className="w-full md:w-3/5 flex-grow">
              <h2 className="text-zui-silver uppercase font-semibold mb-4">
                Media
              </h2>
              <PartnerImages data={data} refetch={refetch} />
            </section>
          </div>
        </div>
      </PageContent>
    </div>
  );
};

export default PartnerBasicInfo;
