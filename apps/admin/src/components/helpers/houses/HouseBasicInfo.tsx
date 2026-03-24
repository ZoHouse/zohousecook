import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { getChangedFields, isValidObject } from "@zo/utils/object";
import { App } from "antd";
import { FormInstance, useForm } from "antd/es/form/Form";
import { Currency, Estate, ZoHouse } from "apps/admin/src/config";
import { useCallback, useEffect, useMemo } from "react";
import { Form, FormElement } from "../../Form";

interface HouseBasicInfoProps {
  data: ZoHouse;
  estateData?: Estate;
  refetch: () => void;
  saveButtonRef: React.MutableRefObject<(() => void) | undefined>;
}

const HouseBasicInfo: React.FC<HouseBasicInfoProps> = ({
  data,
  refetch,
  estateData,
  saveButtonRef,
}) => {
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

  const { mutate: updateOperator } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "PUT"
  );
  const { mutate: updateEstate } = useMutationApi("CAS_ESTATE", {}, "", "PUT");

  const operatorInitialData = useMemo(() => {
    if (data) {
      return {
        destination: data.destination.id,
        name: data.name,
        email: data.email,
        address: data.address,
        twitterHandle: data.data.twitter_handle,
        "data.app_background_image": data.data.app_background_image,
        estate: data.estate?.id,
        currency: data.currency.id,
        tagline: data.tagline,
        alt_name: data.alt_name,
        phone: data.phone,
        status: data.status,
      };
    } else {
      return {};
    }
  }, [data]);

  const estateInitialData = useMemo(() => {
    return isValidObject(estateData)
      ? {
          location: estateData?.location,
          accessible_distance: estateData?.accessible_distance,
        }
      : {};
  }, [estateData]);

  const [operatorForm] = useForm();
  const [locationForm] = useForm();

  const checkFormChanged = (form: FormInstance, initialData: GeneralObject) => {
    const _data = { ...form.getFieldsValue() };
    const changedData = getChangedFields(initialData, _data);
    return Object.keys(changedData).length > 0;
  };

  const handleSave = useCallback(() => {
    const hasOperatorFormChanged = checkFormChanged(
      operatorForm,
      operatorInitialData
    );

    const hasLocationFormChanged = checkFormChanged(
      locationForm,
      estateInitialData
    );

    // Only proceed if there are actual changes
    if (hasOperatorFormChanged) {
      const _data = { ...operatorForm.getFieldsValue() };

      const transformDotNotation = (data: Record<string, any>) => {
        const transformed: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
          if (key.includes("data.")) {
            const [prefix, field] = key.split(".");
            if (!transformed[prefix]) {
              transformed[prefix] = {};
            }
            transformed[prefix][field] = value;
          } else {
            transformed[key] = value;
          }
        });

        return transformed;
      };

      const changedData = getChangedFields(operatorInitialData, _data);
      const transformedData = transformDotNotation(changedData);

      updateOperator(
        {
          data: transformedData,
          route: `${data.id}/`,
        },
        {
          onSuccess() {
            message.success("House Info Updated!");
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }

    // Handle location/estate updates
    if (hasLocationFormChanged && estateData) {
      const locationFormData = { ...locationForm.getFieldsValue() };
      const changedLocationData = getChangedFields(
        estateInitialData,
        locationFormData
      );
      updateEstate(
        {
          data: changedLocationData,
          route: `${estateData?.id}/`,
        },
        {
          onSuccess() {
            message.success("Location Details Updated!");
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  }, [
    operatorForm,
    locationForm,
    operatorInitialData,
    estateInitialData,
    data.id,
    estateData,
    updateOperator,
    updateEstate,
    refetch,
    message,
  ]);

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
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
      name: "data.app_background_image",
      label: "App Background Image",
      type: "mediaLinkGenerator",
    },
  ];

  const locationFormFields: FormElement[] = [
    {
      name: "location",
      label: "Coordinates",
      type: "coordinates",
      required: true,
    },
    {
      name: "accessible_distance",
      label: "Accessible Distance",
      type: "number",
      required: true,
    },
  ];

  useEffect(() => {
    if (data && isValidObject(data)) {
      operatorForm.setFieldsValue(operatorInitialData);
    }

    if (estateData && isValidObject(estateData)) {
      locationForm.setFieldsValue(estateInitialData);
    }
  }, [data, estateData]);

  useEffect(() => {
    saveButtonRef.current = handleSave;
  }, [handleSave, saveButtonRef]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto py-6 w-full">
        <section className="w-full md:w-1/2 flex-grow">
          <h2 className="text-zui-silver uppercase font-semibold mb-4">
            House Basic Info
          </h2>
          <Form formFields={formFields} formData={operatorForm} />
        </section>
        <section className="w-full md:w-1/2 flex-grow">
          <h2 className="text-zui-silver uppercase font-semibold mb-4">
            Location Info
          </h2>
          <Form formFields={locationFormFields} formData={locationForm} />
        </section>
      </div>
    </div>
  );
};

export default HouseBasicInfo;
