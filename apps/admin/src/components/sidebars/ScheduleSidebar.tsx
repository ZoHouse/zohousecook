import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import {
  CASHousekeepingSchedule,
  CASHousekeepingTemplate,
  Estate,
  Space,
} from "../../config";
import { Form, FormElement } from "../Form";
import { MultipleTimeInput } from "../ui";

interface ScheduleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string | null;
}

const ScheduleSidebar: React.FC<ScheduleSidebarProps> = ({
  isOpen,
  onClose,
  scheduleId,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();
  const estate = useWatch("estate", form);

  const [timings, setTimings] = useState<string[]>([""]);

  const { data: scheduleDetails } = useQueryApi<CASHousekeepingSchedule>(
    "CAS_HOUSEKEEPING_SCHEDULES",
    {
      enabled: isOpen && scheduleId != null,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${scheduleId}/`
  );

  const initialData = useMemo(() => {
    if (scheduleDetails) {
      return {
        ...scheduleDetails,
        template: scheduleDetails.template.id,
        space: scheduleDetails.space?.id,
        estate: scheduleDetails.space.floor.estate.id,
      };
    } else {
      return {};
    }
  }, [scheduleDetails]);

  const { data: templateOptions } = useQueryApi<
    Array<{ value: string; label: string }>
  >("CAS_HOUSEKEEPING_TEMPLATES", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.results.map((template: CASHousekeepingTemplate) => ({
        label: template.title,
        value: template.id,
      })),
  });
  const { data: estateOptions } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_ESTATES",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((estate: Estate) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=100"
  );

  const { data: spaceOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      enabled: isValidString(estate) && isOpen,
      select: (data) =>
        data.data.results.map((estate: Space) => ({
          value: estate.id,
          label: estate.name,
        })),
    },
    "",
    `floor__estate=${estate}&limit=100`
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: true,
    select: (data) => data.data,
  });

  const { mutate: createSchedule } = useMutationApi(
    "CAS_HOUSEKEEPING_SCHEDULES"
  );
  const { mutate: updateSchedule } = useMutationApi(
    "CAS_HOUSEKEEPING_SCHEDULES",
    {},
    "",
    "PUT"
  );

  const weekDaysOptions = useMemo(() => {
    if (seed) {
      return seed["task-schedules"].weekdays.map((day: string) => ({
        label: formatCapitalize(day),
        value: day,
      }));
    }
  }, [seed]);

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
      type: "radio",
      label: "Status",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
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
      disabled: !isValidString(estate),
      options: spaceOptions,
    },
    {
      name: "weekdays",
      type: "multiSelect",
      label: "Week Days",
      required: true,
      options: weekDaysOptions,
    },
    {
      name: "special_instructions",
      type: "textarea",
      label: "Special Instruction",
      required: true,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    setTimings([""]);
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        timings: timings.filter((timing) => timing != ""),
      };

      if (scheduleId) {
        updateSchedule(
          { data: data, route: `${scheduleId}/` },
          {
            onSuccess() {
              message.success("Schedule Updated");
              queryClient.invalidateQueries([
                "cas",
                "housekeeping",
                "schedules",
                "tasks",
              ]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else {
        createSchedule(
          {
            data: data,
          },
          {
            onSuccess() {
              message.success("Schedule Created");
              queryClient.invalidateQueries([
                "cas",
                "housekeeping",
                "schedules",
                "tasks",
              ]);
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
    if (scheduleDetails && scheduleId && initialData) {
      form.setFieldsValue(initialData);
      setTimings(scheduleDetails.timings);
    } else {
      form.resetFields();
      setTimings([""]);
    }
  }, [scheduleDetails, scheduleId, initialData]);

  return (
    <Drawer
      title={scheduleId ? "Update Schedule" : "Add a New Schedule"}
      onClose={handleClose}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
      open={isOpen}
    >
      <div>
        <Form formData={form} formFields={formFields} />
        <MultipleTimeInput
          label="Timing"
          name="timings"
          setTimings={setTimings}
          timings={timings}
        />
      </div>
    </Drawer>
  );
};

export default ScheduleSidebar;
