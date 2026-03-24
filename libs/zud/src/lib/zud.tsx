/* eslint-disable @typescript-eslint/no-explicit-any */

import AddIcon from "@mui/icons-material/Add";
import {
  MutationEndpoints,
  QueryEndpoints,
  useMutationApi,
  useQueryApi,
  useWebSocketConnect,
} from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import {
  addRouteToUrl,
  combineRouteAndQueryParams,
  isValidString,
  simpleSingularize,
} from "@zo/utils/string";
import { Space, Statistic, message } from "antd";
import { Page, PageHeader, useInfiniteTable } from "libs/moal/src";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FormFieldType } from "../components/form/definitions";
import ZudDetailsMini, {
  ZudDetailsMiniDataType,
} from "./helpers/ZudDetailsMini";
import ZudEditMini from "./helpers/ZudEditMini";
import ZudFilterOptions, {
  ZudFilterOptionType,
} from "./helpers/ZudFilterOptions";
import ZudTable from "./helpers/ZudTable";
import { useUpdateSocketResponse } from "@zo/utils/hooks";

// function to separate keys with file type property value from the rest of the object
const separateFileKeys = (obj: GeneralObject) => {
  const fileKeys = Object.keys(obj).filter(
    (key) => obj[key]?.file instanceof File || typeof obj[key]?.url === "string"
  );
  const restKeys = Object.keys(obj).filter(
    (key) =>
      !(obj[key]?.file instanceof File || typeof obj[key]?.url === "string")
  );
  const fileObj: GeneralObject = {};
  fileKeys.forEach((key) => {
    fileObj[key] = obj[key];
  });
  const restObj: GeneralObject = {};
  restKeys.forEach((key) => {
    restObj[key] = obj[key];
  });
  return { fileObj, restObj };
};

interface ZudProps {
  queryEndpoint: QueryEndpoints;
  mutationEndpoint: MutationEndpoints;
  name: string;
  title: string;
  columns: any[];
  formFields?: FormFieldType[];
  filterOptions?: ZudFilterOptionType[];
  customAddFields?: GeneralObject;
  conditionalFormRenders?: {
    [key: string]: (data: GeneralObject) => boolean;
  };
  detailsMini?: ZudDetailsMiniDataType;
  onRowClick?: (data: GeneralObject) => void;
  searchable?: boolean;
  searchKey?: string;
  stats?: Array<{ label: string; value: number }>;
  onAddClick?: () => void;
  breadCrumbs?: Array<{ label: string; href: string }>;
  customSearchQuery?: string;
  showEditButton?: boolean;
  additionalRoute?: string;
  addButtonLabel?: string;
  tableClassName?: string;
  allowEdit?: boolean;
}

const Zud: React.FC<ZudProps> = ({
  queryEndpoint,
  mutationEndpoint,
  onRowClick,
  name,
  title,
  formFields,
  columns,
  filterOptions,
  detailsMini,
  searchable,
  searchKey,
  customAddFields,
  conditionalFormRenders,
  customSearchQuery,
  onAddClick,
  breadCrumbs,
  stats,
  showEditButton,
  additionalRoute,
  addButtonLabel,
  tableClassName,
  allowEdit = true,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [allData, setAllData] = useState<GeneralObject[]>([]);

  const [showDetailsMini, setShowDetailsMini] = useState<boolean>(false);
  const [showEditMini, setShowEditMini] = useState<boolean>(false);

  const [editData, setEditData] = useState<GeneralObject | undefined>(
    undefined
  );
  const [refetchingId, setRefetchingId] = useState<string | null>(null);

  const { mutateAsync: update, isLoading: isLoadingUpdate } = useMutationApi(
    mutationEndpoint,
    {},
    "",
    "PUT"
  );

  const { mutate: add, isLoading: isLoadingAdd } = useMutationApi(
    mutationEndpoint,
    {},
    ``,
    "POST"
  );

  const { mutateAsync: addMedia } = useMutationApi("CAS_MEDIA", {}, "");

  const { mutateAsync: updateMedia, isLoading: isLoadingUpdateMedia } =
    useMutationApi("CAS_MEDIA", {}, "", "PUT");

  const { isLoading: isLoadingTableData } = useInfiniteTable({
    name: name,
    setter: setAllData,
    queryEndpoint,
    filterOptions,
    customSearchQuery,
    additionalRoute,
  });

  const { socket, isConnected, disconnect } = useWebSocketConnect({
    route: "cas",
  });

  useUpdateSocketResponse({
    socket,
    identifier: name,
    queryEndpoint,
    data: allData,
    setter: setAllData,
    enabled: true,
    handleSocketClose: disconnect,
    isConnected,
  });

  const { refetch: refetchRow } = useQueryApi(
    queryEndpoint,
    {
      enabled: isValidString(refetchingId),
      select: (data) => data.data,
      onSuccess: (data) => {
        handleRowUpdate(data, "upsert");
        setRefetchingId(null);
        closeEditBar();
      },
    },
    `${refetchingId}/`,
    ""
  );

  const closeDetailsMini = () => {
    setShowDetailsMini(false);
    setSelectedRow(null);
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const closeEditBar = () => {
    setEditData(undefined);
    setShowEditMini(false);
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const showAddModal = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      setEditData({ id: null });
      setShowEditMini(true);
    }
    router.push(
      addRouteToUrl(router.pathname, `new`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleUpdate = async (
    id: any,
    data: GeneralObject,
    onSuccessCallback?: () => void
  ) => {
    try {
      const { fileObj, restObj } = separateFileKeys(data);

      if (!isValidObject(restObj) && !isValidObject(fileObj)) {
        closeEditBar();
        return;
      }

      const updatePromises = [];
      if (isValidObject(restObj) && isValidString(id)) {
        updatePromises.push(update({ data: restObj, route: `${id}/` }));
      }

      if (isValidObject(fileObj)) {
        Object.keys(fileObj).forEach((key) => {
          const formData = new FormData();
          if (fileObj[key].file instanceof File) {
            formData.append("file", fileObj[key].file);
            formData.append("category", fileObj[key].category);
          }
          formData.append("metadata", JSON.stringify(fileObj[key].metadata));

          if (fileObj[key].id) {
            updatePromises.push(
              updateMedia({
                data: formData,
                route: `${fileObj[key].id}/`,
              })
            );
          } else if (fileObj[key].file instanceof File) {
            updatePromises.push(
              addMedia({
                data: formData,
                route: `${fileObj[key].relationType}/${id}/`,
              })
            );
          }
        });
      }

      await Promise.all(updatePromises);
      messageApi.success("Updated successfully");
      setRefetchingId(id);
      onSuccessCallback?.();
    } catch (error: any) {
      messageApi.error(processResponseError(error));
    }
  };

  const handleAdd = async (
    data: GeneralObject,
    onSuccessCallback?: () => void
  ) => {
    try {
      const { fileObj, restObj } = separateFileKeys(data);
      const customFields = isValidObject(customAddFields)
        ? customAddFields
        : {};
      const newRestObj = { ...restObj, ...customFields };

      const addResponse: any = await new Promise((resolve) => {
        add(
          { data: newRestObj },
          {
            onSuccess: resolve,
            onError: (error) => {
              messageApi.error(processResponseError(error));
              throw error;
            },
          }
        );
      });

      if (Object.keys(fileObj).length > 0) {
        const filePromises = Object.keys(fileObj).map((key) => {
          const formData = new FormData();
          formData.append("file", fileObj[key].file);
          formData.append("category", fileObj[key].category);
          formData.append(
            "metadata",
            JSON.stringify({
              title: fileObj[key].title,
              description: fileObj[key].description,
              alt_text: fileObj[key].alt_text,
            })
          );
          return addMedia({
            data: formData,
            route: `${fileObj[key].relationType}/${addResponse.data.id}/`,
          });
        });

        await Promise.all(filePromises);
      }

      handleRowUpdate(addResponse.data);
      messageApi.success("Added successfully");
      onSuccessCallback?.();
      closeEditBar();
    } catch (error: any) {
      messageApi.error(processResponseError(error));
    }
  };

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
          const newData = [...prev];
          newData[index] = { ...data };
          return newData;
        }
      } else {
        return prev.filter((item) => item.id !== data.id);
      }
    });
  };

  const handleRowSelect = (data: any) => {
    setSelectedRow(data.id);
    if (onRowClick) {
      onRowClick(data);
      return;
    }

    if (detailsMini) {
      router.push(
        addRouteToUrl(router.pathname, `${data.id}/`, router.query),
        undefined,
        { shallow: true }
      );
      setShowDetailsMini(true);
      return;
    }

    if (formFields) {
      if (!allowEdit) {
        return;
      }
      setEditData(data);
      setShowEditMini(true);
      router.push(
        addRouteToUrl(router.pathname, `${data.id}/edit`, router.query),
        undefined,
        { shallow: true }
      );
    }
  };

  useEffect(() => {
    const slug = router.query.slug?.[0];

    if (isValidString(slug)) {
      if (detailsMini && slug !== "new") {
        setSelectedRow(String(slug));
        setShowDetailsMini(true);
        return;
      }

      if (formFields) {
        if (slug === "new") {
          setShowEditMini(true);
        } else if (!onRowClick && router.query.slug?.[1] === "edit") {
          if (!allowEdit) {
            return;
          }
          setEditData({ id: slug });
          setShowEditMini(true);
        }
      }
    }
  }, [router.query, name, detailsMini, formFields, onRowClick]);

  return (
    <Page breadCrumbs={breadCrumbs}>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <PageHeader
          title={title}
          buttons={
            // eslint-disable-next-line eqeqeq
            formFields != null || onAddClick != undefined
              ? [
                  {
                    icon: <AddIcon />,
                    label: addButtonLabel
                      ? addButtonLabel
                      : `Add ${simpleSingularize(title)}`,
                    onClick: showAddModal,
                    type: "secondary",
                  },
                ]
              : undefined
          }
        />

        {stats && stats.length > 0 && (
          <Space size="large" wrap>
            {stats.map((stat) => (
              <Statistic
                key={stat.label}
                title={stat.label}
                value={stat.value}
              />
            ))}
          </Space>
        )}

        <div>
          {(filterOptions || searchable) && (
            <ZudFilterOptions
              name={name}
              options={filterOptions || []}
              hasSearch={searchable}
              searchKey={searchKey}
            />
          )}

          <ZudTable
            isLoading={isLoadingTableData}
            className={tableClassName}
            onRowClick={handleRowSelect}
            columns={columns}
            data={allData}
          />
        </div>
      </Space>

      {detailsMini && (
        <ZudDetailsMini
          onRowUpdate={handleRowUpdate}
          isOpen={showDetailsMini}
          onClose={closeDetailsMini}
          id={String(selectedRow)}
          queryEndpoint={queryEndpoint}
          data={detailsMini}
          showEditButton={showEditButton}
          title={name}
        />
      )}

      {formFields && (
        <ZudEditMini
          queryEndpoint={queryEndpoint}
          isOpen={showEditMini}
          tableName={title}
          conditionalFormRenders={conditionalFormRenders}
          data={editData}
          onClose={closeEditBar}
          onUpdate={handleUpdate}
          onAdd={handleAdd}
          formFields={formFields}
          isLoading={isLoadingUpdate || isLoadingAdd || isLoadingUpdateMedia}
        />
      )}
    </Page>
  );
};

export default Zud;
