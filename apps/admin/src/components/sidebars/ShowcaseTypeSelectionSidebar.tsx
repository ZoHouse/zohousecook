import { AddOutlined } from "@mui/icons-material";
import {
  MutationEndpoints,
  QueryEndpoints,
  useMutationApi,
  useQueryApi,
} from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { areStringArraysEqual } from "@zo/utils/array";
import { isValidObject } from "@zo/utils/object";
import { FormFieldType, ZudEditMini } from "@zo/zud";
import { Button, Checkbox, Drawer, Empty, Flex, Spin, Typography } from "antd";
import React, { useState } from "react";

import { FormElement } from "../Form";
export type Id = number | string | null;
interface ShowcaseTypeSelectionSidebarProps {
  name: string;
  preSelectedIds?: string[];
  renderEntry: (
    entry: GeneralObject,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;
  uniqueKey?: string;
  queryEndpoint: QueryEndpoints;
  mutationEndpoint: MutationEndpoints;
  formFields: FormElement[];
  open: boolean;
  onClose: () => void;
  onDone: (selectedEntries: GeneralObject[]) => void;
}

const ShowcaseTypeSelectionSidebar: React.FC<
  ShowcaseTypeSelectionSidebarProps
> = ({
  name,
  renderEntry,
  onClose,
  onDone,
  queryEndpoint,
  uniqueKey = "id",
  mutationEndpoint,
  formFields,
  preSelectedIds = [],
  open,
}) => {
  const [isAddition, setAddition] = useState<boolean>(false);

  const { mutateAsync: update, isLoading: isUpdating } = useMutationApi(
    mutationEndpoint,
    {},
    "",
    "PUT"
  );

  const { mutate: add, isLoading: isAdding } = useMutationApi(
    mutationEndpoint,
    {},
    ``,
    "POST"
  );

  const { mutateAsync: addMedia, isLoading: isAddingMedia } = useMutationApi(
    "CAS_MEDIA",
    {},
    ""
  );

  const { mutateAsync: updateMedia, isLoading: isUpdatingMedia } =
    useMutationApi("CAS_MEDIA", {}, "", "PUT");

  const { data: preSelectedEntries, isFetching: isFetchingPreSelectedEntries } =
    useQueryApi<GeneralObject[]>(
      queryEndpoint,
      {
        enabled: preSelectedIds.length > 0,
        refetchOnWindowFocus: false,
        select: (data) => data.data.results,
      },
      "",
      `ids=${preSelectedIds.join(",")}`
    );

  const {
    data,
    isFetching: isFetchingData,
    refetch,
  } = useQueryApi<GeneralObject[]>(
    queryEndpoint,
    {
      enabled: open,
      refetchOnWindowFocus: false,
      select: (data) => data?.data,
    },
    "",
    "limit=-1&status=active"
  );

  const [selectedEntries, setSelectedEntries] =
    React.useState<string[]>(preSelectedIds);

  const selectEntry = (id: string) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter((entry) => entry !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  const handleUpdate = (id: Id, data: GeneralObject) => {
    const { fileObj, restObj } = separateFileKeys(data);

    if (!isValidObject(restObj) && !isValidObject(fileObj)) {
      setAddition(false);
    } else {
      const updatePromises = [];
      if (isValidObject(restObj)) {
        updatePromises.push(update({ data: restObj, route: `${id}/` }));
      }
      if (isValidObject(fileObj)) {
        Object.keys(fileObj).map((key: string) => {
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
      Promise.all(updatePromises).then((response) => {
        setAddition(false);
      });
    }
  };

  const handleClose = () => {
    onClose();
  };
  const handleDone = () => {
    if (!data) return;

    const _selectedEntires = data.filter((entry) =>
      selectedEntries.includes(entry[uniqueKey])
    );
    onDone(_selectedEntires);
    handleClose();
  };

  const handleAdd = (data: GeneralObject) => {
    const { fileObj, restObj } = separateFileKeys(data);

    add(
      { data: restObj },
      {
        onSuccess(response: GeneralObject) {
          if (Object.keys(fileObj).length > 0) {
            Promise.all(
              Object.keys(fileObj).map((key) => {
                const formData = fileObj[key];
                const mediaKey = formData.get("media_key");
                return addMedia({
                  data: formData,
                  route: `${mediaKey}/${response.data[uniqueKey]}/`,
                });
              })
            )
              .then((data) => {
                refetch();
                setAddition(false);
              })
              .catch((err) => {
                console.error("Error adding media:", err);
              });
          } else {
            setAddition(false);
          }
        },
      }
    );
  };

  const isLoading = isAdding || isUpdating || isAddingMedia || isUpdatingMedia;

  return (
    <>
      <Drawer
        title={
          <Flex vertical align="start">
            <Typography.Text className="capitalize m-0">
              Select {name}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {selectedEntries.length} selected
            </Typography.Text>
          </Flex>
        }
        size="large"
        open={open}
        onClose={handleClose}
        extra={
          <Flex justify="end" gap={16} align="center">
            {Array.isArray(formFields) && formFields.length > 0 && (
              <Button
                type="text"
                icon={<AddOutlined />}
                onClick={setAddition.bind(null, true)}
                className="text-zui-neon"
              >
                New {name}
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleDone}
              disabled={areStringArraysEqual(preSelectedIds, selectedEntries)}
            >
              Update
            </Button>
          </Flex>
        }
      >
        {selectedEntries.length > 0 && (
          <Button type="default" onClick={() => setSelectedEntries([])}>
            Deselect All
          </Button>
        )}

        <Spin spinning={isLoading}>
          <Flex vertical className="mt-6 h-full ">
            <Typography.Text
              type="secondary"
              strong
              style={{ textTransform: "uppercase", fontSize: "16px" }}
            >
              All Entries
            </Typography.Text>
            <div className="grid grid-cols-3 gap-4 mt-6 w-full ">
              {data && data.length > 0 ? (
                data
                  .filter(
                    (entry) => !preSelectedEntries?.includes(entry[uniqueKey])
                  )
                  .map((entry, index) => (
                    <div
                      key={entry[uniqueKey]}
                      className={` p-[1px] flex items-center h-fit relative rounded-lg`}
                    >
                      {renderEntry(
                        entry,
                        index,
                        selectedEntries.includes(entry[uniqueKey])
                      )}
                      <Checkbox
                        className="absolute top-4 right-4"
                        checked={selectedEntries.includes(entry[uniqueKey])}
                        onChange={() => selectEntry(entry[uniqueKey])}
                      />
                    </div>
                  ))
              ) : (
                <Empty description={`No ${name} found`} />
              )}
            </div>
          </Flex>
        </Spin>
      </Drawer>
      <ZudEditMini
        queryEndpoint={queryEndpoint}
        isOpen={isAddition}
        tableName={name}
        onClose={setAddition.bind(null, false)}
        formFields={formFields as FormFieldType[]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        isLoading={isLoading}
      />
    </>
  );
};

const separateFileKeys = (obj: GeneralObject) => {
  const fileKeys = Object.keys(obj).filter(
    (key) =>
      obj[key]?.file instanceof File ||
      obj[key] instanceof FormData ||
      (typeof obj[key]?.url === "string" && typeof obj[key]?.id === "string") ||
      key === "media"
  );
  const restKeys = Object.keys(obj).filter(
    (key) =>
      !(
        obj[key]?.file instanceof File ||
        obj[key] instanceof FormData ||
        (typeof obj[key]?.url === "string" &&
          typeof obj[key]?.id === "string") ||
        key === "media"
      )
  );
  const fileObj: GeneralObject = {};
  fileKeys.forEach((key) => {
    fileObj[key] = obj[key];
  });
  let restObj: GeneralObject = {};
  restKeys.forEach((key) => {
    restObj = { ...restObj, [key]: obj[key] };
  });
  return { fileObj, restObj };
};

export default ShowcaseTypeSelectionSidebar;
