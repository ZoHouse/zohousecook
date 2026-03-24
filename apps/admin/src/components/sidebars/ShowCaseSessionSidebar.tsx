import { Button, Collapse, Drawer, Flex, message, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";

import { useRouter } from "next/router";

import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";

import TvOutlinedIcon from "@mui/icons-material/TvOutlined";
import { useEffect } from "react";
import { Estate, ShowcaseDisplay, ShowcaseSession, Space } from "../../config";
import { Form, FormElement } from "../Form";
import { ShowCaseSelectionSidebar } from "../helpers/showcase";

interface ShowcaseSessionSidebarProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  refetch: () => void;
}

const refreshRates = [10, 15, 20, 30, 60, 120, 180, 300, 600];
const artPerScreen = [1, 2, 3, 4];
const sampleRefreshRate = refreshRates[0];
const sampleArtPerScreen = artPerScreen[artPerScreen.length - 1];
const orientations = ["portrait-right", "portrait-left", "landscape"];

const ShowcaseSessionSidebar: React.FC<ShowcaseSessionSidebarProps> = ({
  open,
  onClose,
  sessionId,
  refetch,
}) => {
  const router = useRouter();
  const [form] = useForm();
  const showcaseType = useWatch("showcase_type", form);

  const { estate, space, display } = router.query;

  const { data: displays } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_SHOWCASE_DISPLAY",
    {
      enabled: isValidString(space),
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((display: ShowcaseDisplay) => ({
          value: display.id,
          label: display.name,
        })),
    },
    "",
    `limit=-1&space=${space}`
  );

  const { data: estates } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_ESTATES",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((estate: Estate) => ({
          value: estate.id,
          label: estate.name,
        })) || [],
    },
    "",
    `limit=-1`
  );

  const { data: spaces } = useQueryApi<Array<{ value: string; label: string }>>(
    "CAS_SPACES",
    {
      enabled: isValidString(estate),
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((space: Space) => ({
          value: space.id,
          label: space.name,
        })) || [],
    },
    "",
    `limit=-1&estate=${estate}`
  );

  // Fetch sessions based on selected filters
  const { data: sessionDetail, isLoading: isSessionLoading } =
    useQueryApi<ShowcaseSession>(
      "CAS_SHOWCASE_DISPLAY_SESSION",
      {
        enabled: isValidString(sessionId),
        select: (data) => data.data,
        refetchOnWindowFocus: false,
      },
      `${sessionId}/`,
      ""
    );

  const { mutate: addSession, isLoading: isAddingSession } = useMutationApi(
    "CAS_SHOWCASE_DISPLAYS_SESSIONS",
    {},
    "",
    "POST"
  );

  const { mutate: updateSession, isLoading: isUpdatingSession } =
    useMutationApi("CAS_SHOWCASE_DISPLAYS_SESSIONS", {}, "", "PUT");

  const { data: statuses } = useQueryApi<string[]>("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => data.data.display_session?.status,
  });

  const { data: showcaseTypes } = useQueryApi<string[]>("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => data.data.display_session?.showcase_type,
  });

  const transformDotNotation = (data: Record<string, any>) => {
    const transformed: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key.includes(".")) {
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

  const handleSave = () => {
    form
      .validateFields()
      .then((formData) => {
        const filterIds = form.getFieldValue("data.filter_ids");
        const _formData = transformDotNotation(formData);

        if (!_formData.data) {
          _formData.data = {};
        }
        _formData.data.filter_ids = filterIds;

        if (sessionId) {
          delete _formData.id;
          delete _formData.created_at;
          delete _formData.updated_at;
          delete _formData.display;
          delete _formData.token;
          updateSession(
            {
              data: _formData,
              route: `${sessionId}/`,
            },
            {
              onSuccess() {
                message.success("Session saved successfully");
                refetch();
              },
              onError(error) {
                message.error("hww");
              },
            }
          );
        } else {
          const _data = {
            status: "active",
            display_orientation: "portrait",
            ..._formData,
          };
          addSession(
            {
              data: _data,
            },
            {
              onSuccess: (data) => {
                message.success("The session has been created successfully.");
                refetch();
              },
              onError(error) {
                message.error(processResponseError(error));
              },
            }
          );
        }
      })
      .catch((error) => {
        message.error("Form validation failed");
      })
      .finally(() => {
        form.resetFields();
        onClose();
      });
  };

  const formFields: FormElement[] = [
    {
      label: "Code",
      name: "token",
      type: "text",
      required: true,
    },
    {
      label: "Status",
      name: "status",
      type: "radio",
      options: statuses?.map((type) => ({
        value: type,
        label: formatCapitalize(type),
      })),
    },
    {
      label: "Estate",
      name: "estate",
      type: "select",
      options: estates,
      disabled: true,
    },
    {
      label: "Space",
      name: "space",
      type: "select",
      options: spaces,
      disabled: true,
    },
    {
      label: "Display",
      name: "display",
      type: "select",
      options: displays,
      disabled: true,
    },
    {
      label: "Showcase Type",
      name: "showcase_type",
      type: "select",
      options: showcaseTypes?.map((type) => ({
        value: type,
        label: formatCapitalize(type),
      })),
    },
    {
      label: "Display Orientation",
      name: "data.display_orientation",
      type: "select",
      disabled: !display,
      options: orientations.map((o) => ({
        value: o,
        label: (
          <Flex align="center" gap="8px">
            {o === "portrait-right" && (
              <span className="rotate-90">
                <TvOutlinedIcon />
              </span>
            )}
            {o === "portrait-left" && (
              <span className="-rotate-90">
                <TvOutlinedIcon />
              </span>
            )}
            {o === "landscape" && <TvOutlinedIcon />}
            {formatCapitalize(o)}
          </Flex>
        ),
      })),
    },
  ];

  const advanedFormFields: FormElement[] = [
    {
      label: "Refresh Rate",
      name: "data.refresh_rate",
      type: "spinner",
      options: refreshRates.map((rate) => ({
        value: String(rate),
        label: String(rate),
      })),
    },
    {
      label: "Art Per Screen",
      name: "data.max_art_per_screen",
      type: "select",
      isHidden: showcaseType !== "collected",
      options: artPerScreen.map((rate) => ({
        value: String(rate),
        label: String(rate),
      })),
    },
  ];

  useEffect(() => {
    if (sessionId && sessionDetail && isValidObject(sessionDetail)) {
      const _formdata = {
        status: sessionDetail.status,
        showcase_type: sessionDetail.showcase_type,
        token: sessionDetail.token,

        "data.display_orientation": sessionDetail.data.display_orientation,
        "data.refresh_rate": sessionDetail.data.refresh_rate,
        "data.max_art_per_screen": sessionDetail.data.max_art_per_screen,
        "data.filter_ids": sessionDetail.data.filter_ids,

        estate,
        space,
        display,
      };

      form.setFieldsValue(_formdata);
    } else {
      form.setFieldValue("display", display);
      form.setFieldValue("space", space);
      form.setFieldValue("estate", estate);

      if (
        !isValidString(display) &&
        isValidString(space) &&
        isValidString(estate)
      ) {
        form.resetFields();
      }
    }
  }, [sessionId, sessionDetail, router.query]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSelectIds = (ids: string[]) => {
    form.setFieldValue("data.filter_ids", ids);
  };

  return (
    <>
      <Drawer
        extra={<Button onClick={handleSave}>Save</Button>}
        open={open}
        onClose={handleClose}
        title={sessionId ? "Edit Session" : "Add New Session"}
      >
        <Spin spinning={isAddingSession || isUpdatingSession}>
          <Form formFields={formFields} formData={form} />

          <Collapse
            items={[
              {
                key: "1",
                label: "Advanced Settings",
                children: (
                  <Flex vertical justify="center">
                    <Form formFields={advanedFormFields} formData={form} />{" "}
                    <ShowCaseSelectionSidebar
                      type={showcaseType}
                      value={form.getFieldValue("data.filter_ids") || []}
                      setValue={handleSelectIds}
                    />
                  </Flex>
                ),
              },
            ]}
          />
        </Spin>
      </Drawer>
    </>
  );
};

export default ShowcaseSessionSidebar;
