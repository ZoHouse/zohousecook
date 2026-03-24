import { useAuth, useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { getChangedFields } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import {
    CASHousekeepingTasks,
    CASHousekeepingTemplate,
    Estate,
    Space,
} from "../../config";
import { Form, FormElement } from "../Form";

interface HousekeepingTasksSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

const HousekeepingTasksSidebar: React.FC<HousekeepingTasksSidebarProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();
  const { user } = useAuth();
  const estate = useWatch("estate", form);

  const { data: taskDetails } = useQueryApi<CASHousekeepingTasks>(
    "CAS_HOUSEKEEPING_TASKS",
    {
      enabled: isOpen && taskId != null,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${taskId}/`
  );
  const { data: templateOptions } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_HOUSEKEEPING_TEMPLATES",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((template: CASHousekeepingTemplate) => ({
          label: template.title,
          value: template.id,
        })),
    },
    "",
    "limit=100"
  );

  const initialValue = useMemo(() => {
    if (taskDetails) {
      const _task: GeneralObject = {
        template: templateOptions?.find(
          (template: { label: string; value: string }) =>
            template.label === taskDetails.title
        )?.value,
        status: taskDetails.status,
        estate: taskDetails.space.floor.estate.id,
        space: taskDetails.space.id,
        description: taskDetails.description,
        scheduled_start: taskDetails.scheduled_start,
        scheduled_finish: taskDetails.scheduled_finish,
        special_instructions: taskDetails.special_instructions,
        priority: taskDetails.priority,
      };

      Object.keys(_task).forEach((key) => {
        const value = String(_task[key]);
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
          _task[key] = dayjs(value);
        }
      });

      return _task;
    } else {
      return {};
    }
  }, [taskDetails, templateOptions]);

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: true,
    select: (data) => data.data,
  });

  const { data: estateOptions } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_ESTATES",
    {
      enabled: isOpen,
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

  const { data: spaceOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      enabled: isValidString(estate) && isOpen,
      select: (data) =>
        data.data.map((estate: Space) => ({
          value: estate.id,
          label: estate.name,
        })),
    },
    "",
    `floor__estate=${estate}&limit=-1`
  );

  const statusOptions = useMemo(() => {
    if (seed) {
      return seed.tasks.status.map((s: string) => ({
        label: formatCapitalize(s),
        value: s,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const priorityOptions = useMemo(() => {
    if (seed) {
      return seed.tasks.priority.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const { mutate: createTask } = useMutationApi(
    "CAS_HOUSEKEEPING_TASKS_FROM_TEMPLATE"
  );
  const { mutate: updateTask } = useMutationApi(
    "CAS_HOUSEKEEPING_TASKS",
    {},
    "",
    "PUT"
  );

  const formFields: FormElement[] = [
    {
      name: "template",
      type: "select",
      label: "Template",
      required: true,
      options: templateOptions,
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      options: statusOptions,
    },
    {
      name: "estate",
      type: "select",
      label: "Estate",
      required: true,
      options: estateOptions,
    },
    {
      name: "space",
      type: "select",
      label: "Space",
      required: true,
      options: spaceOptions,
      disabled: !isValidString(estate),
    },
    {
      name: "priority",
      type: "select",
      label: "Priority",
      required: true,
      options: priorityOptions,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
    },
    {
      name: "scheduled_start",
      type: "datetime",
      label: "Start At",
      required: true,
      initialValue: new Date(),
    },
    {
      name: "scheduled_finish",
      type: "datetime",
      label: "Finish At",
      required: true,
    },
    {
      name: "special_instructions",
      type: "textarea",
      label: "Special Instruction",
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!user) {
        message.error("Please login to continue");
        return;
      }

      Object.keys(values).forEach((key) => {
        const value = values[key];
        if (dayjs.isDayjs(value)) {
          values[key] = value.format("YYYY-MM-DDTHH:mm:ssZ");
        }
      });

      if (taskId) {
        const _intialValue = { ...initialValue };

        Object.keys(_intialValue).forEach((key) => {
          const value = _intialValue[key];
          if (dayjs.isDayjs(value)) {
            _intialValue[key] = value.format("YYYY-MM-DDTHH:mm:ssZ");
          }
        });

        const _data = getChangedFields(_intialValue, values);

        updateTask(
          {
            data: { ..._data, requested_by: user.id },
            route: `${taskId}/`,
          },
          {
            onSuccess() {
              message.success("Task Updated");
              queryClient.invalidateQueries(["cas", "housekeeping", "tasks"]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else {
        createTask(
          {
            data: { ...values, requested_by: user.id },
          },
          {
            onSuccess() {
              message.success("Task Created");
              queryClient.invalidateQueries(["cas", "housekeeping", "tasks"]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    });
  };

  useEffect(() => {
    if (taskId && initialValue) {
      form.setFieldsValue(initialValue);
    } else {
      form.resetFields();
    }
  }, [taskId, initialValue]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={taskId ? "Update Task" : "Add a New Task"}
      extra={<Button onClick={handleSave}>Save</Button>}
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default HousekeepingTasksSidebar;
