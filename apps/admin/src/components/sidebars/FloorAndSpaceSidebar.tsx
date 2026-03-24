import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Floor } from "../../config";
import { Form, FormElement } from "../Form";

interface FloorAndSpaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  input: "Floor" | "Space";
  estateId: string;
  entityId: string | null;
  refetchFloors: () => void;
}

const spaceCategory = [
  { label: "Other", value: "other" },
  { label: "Private Room", value: "private_room" },
  { label: "Dorm Room", value: "dorm_room" },
  { label: "Living Room", value: "living_room" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Balcony", value: "balcony" },
  { label: "Stairs", value: "stairs" },
  { label: "Hallway", value: "hallway" },
  { label: "Terrace", value: "terrace" },
  { label: "Workspace", value: "workspace" },
  { label: "Workstation", value: "workstation" },
  { label: "Meeting Room", value: "meeting_room" },
  { label: "Conference Room", value: "conference_room" },
  { label: "Lounge", value: "lounge" },
  { label: "Lobby", value: "lobby" },
  { label: "Gym", value: "gym" },
  { label: "Pool", value: "pool" },
  { label: "Entrance", value: "entrance" },
  { label: "Elevator", value: "elevator" },
  { label: "Dining Area", value: "dining_area" },
  { label: "Laundry", value: "laundry" },
];

const FloorAndSpaceSidebar: React.FC<FloorAndSpaceSidebarProps> = ({
  entityId,
  isOpen,
  onClose,
  input,
  estateId,
  refetchFloors,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data } = useQueryApi<GeneralObject>(
    input === "Floor" ? "CAS_FLOORS" : "CAS_SPACES",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      enabled: isValidString(entityId) && isValidString(estateId),
    },
    `${entityId}/`
  );

  const formattedData = useMemo(() => {
    if (data && isValidObject(data)) {
      if (input === "Floor") {
        return data;
      } else {
        return {
          name: data.name,
          category: data.category,
          floor: data.floor?.id,
        };
      }
    } else {
      return {};
    }
  }, [data]);

  const { data: floorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_FLOORS",
    {
      enabled: isValidString(estateId) && isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((floor: Floor) => ({
          value: floor.id,
          label: floor.name,
        })),
    },
    "",
    `estate=${estateId}&limit=100`
  );

  const { mutate: createSpace } = useMutationApi("CAS_SPACES", {}, "", "POST");
  const { mutate: createFloor } = useMutationApi("CAS_FLOORS", {}, "", "POST");

  const { mutate: updateSpace } = useMutationApi("CAS_SPACES", {}, "", "PUT");
  const { mutate: updateFloor } = useMutationApi("CAS_FLOORS", {}, "", "PUT");

  const handleClose = () => {
    form.resetFields();
    if (input === "Floor") {
      refetchFloors();
    }
    onClose();
  };

  const handleSave = () => {
    if (isValidString(entityId)) {
      if (input === "Floor") {
        updateFloor(
          {
            data: { name: form.getFieldValue("name") },
            route: `${entityId}/`,
          },
          {
            onSuccess() {
              message.success("Success");
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
      if (input === "Space") {
        updateSpace(
          {
            data: {
              name: form.getFieldValue("name"),
              category: form.getFieldValue("category"),
              floor: form.getFieldValue("floor"),
            },
            route: `${entityId}/`,
          },
          {
            onSuccess() {
              message.success("Success");
              queryClient.invalidateQueries(["cas", "spaces"]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    } else {
      if (input === "Floor") {
        createFloor(
          {
            data: { name: form.getFieldValue("name"), estate: estateId },
          },
          {
            onSuccess() {
              message.success("Success");
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
      if (input === "Space") {
        createSpace(
          {
            data: {
              name: form.getFieldValue("name"),
              category: form.getFieldValue("category"),
              floor: form.getFieldValue("floor"),
            },
          },
          {
            onSuccess() {
              message.success("Success");
              queryClient.invalidateQueries(["cas", "spaces"]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    }
  };

  const floorFormFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
  ];

  const spaceFormFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "floor",
      type: "select",
      label: "Floor",
      options: floorOptions,
      required: true,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      options: spaceCategory,
      required: true,
    },
  ];

  useEffect(() => {
    if (formattedData && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    }
  }, [formattedData]);

  return (
    <Drawer
      title={`${isValidString(entityId) ? "Update" : "Add"} ${input}`}
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={400}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Form
        formData={form}
        formFields={input === "Floor" ? floorFormFields : spaceFormFields}
      />
    </Drawer>
  );
};

export default FloorAndSpaceSidebar;
