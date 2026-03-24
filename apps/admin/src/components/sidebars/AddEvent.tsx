import { useAuth, useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useVisibilityState, useWindowSize } from "@zo/utils/hooks";
import { formatCapitalize, slugify } from "@zo/utils/string";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";

import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  CheckCircleOutlined,
  InfoOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject, removeUndefinedKeys } from "@zo/utils/object";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Modal,
  Tag,
  Typography,
  message,
} from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import { FormInstance } from "antd/lib";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import {
  AllowList,
  CASEligibilityResponse,
  Inventory,
  Node,
  Profile,
  ZoHouse,
} from "../../config";
import { Form, FormElement } from "../Form";
import { CreateNewNodeButton } from "../helpers/events";
import { SidebarMobileHeader } from "../helpers/general";
import CreateEventNodeSidebar from "./CreateEventNodeSidebar";
import CustomQuestionSidebar from "./CustomQuestionSidebar";
import ImageUploaderSidebar, {
  ImageUploaderFile,
} from "./ImageUploaderSidebar";
import AddTicket from "./TicketSidebar";

const NO_OF_SCREENS = 4;
interface AddEventSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
export interface CustomTicket {
  id: number | string;
  name: string;
  price: number;
  units: number;
  location: string;
  hasInfiniteUnits: boolean;
}

export interface CustomQuestion {
  id: string;
  text: string;
  choices?: string[];
  format: "text" | "number" | "select" | "multiselect";
}

const CustomQuestionTypesMap = {
  text: "Text",
  number: "Number",
  multiselect: "Multiple Select",
  select: "Single Select",
};

const getEventTitle = (screen: number, form: GeneralObject): string => {
  switch (screen) {
    case 1:
      return "Create Event";
    case 2:
      return `${form.name || ""} • Custom Questions`;
    case 3:
      return `${form.name || ""} • Tickets`;
    default:
      return "";
  }
};

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

const DRAFT_KEY_PREFIX = "eventDraft";

const AddEventSidebar: React.FC<AddEventSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { isMobile } = useWindowSize();
  const router = useRouter();

  const { user } = useAuth();

  const [isAddTicketVisible, showAddTicketSidebar, hideAddTicketSidebar] =
    useVisibilityState(false);

  const [isLoadDraftModalOpen, showLoadDraftModal, hideLoadDraftModal] =
    useVisibilityState();

  const [isSaveDraftModalOpen, showSaveDraftModal, hideSaveDraftModal] =
    useVisibilityState();

  const [event, setEvent] = useState<Inventory | null>(null);
  const [isImagePickerVisible, showImagePicker, hideImagePicker] =
    useVisibilityState(false);
  const [
    isCustomQuestionSidebarVisible,
    showCustomQuestionSidebar,
    hideCustomQuestionSidebar,
  ] = useVisibilityState();

  const [isNodeSidebarVisible, showNodeSidebar, hideNodeSidebar] =
    useVisibilityState();

  const [screen, setScreen] = useState<number>(1);
  const [coverpreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [form] = useForm();
  const eventCategory = useWatch("category", form);
  const selectedOperator = useWatch("operator", form);
  const startAt = useWatch("start_at", form);

  const [coverImage, setCoverImage] = useState<ImageUploaderFile | null>(null);
  const [customTickets, setCustomTickets] = useState<CustomTicket[]>([]);

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  const [draftExists, setDraftExists] = useState<boolean>(false);

  const { data: allOperatorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_OPERATORS",
    {
      enabled: isOpen,
      select: (data) =>
        data.data.results.map((operator: ZoHouse) => ({
          label: operator.name,
          value: operator.id,
        })),
    },
    "",
    "limit=100"
  );

  // need to fetch spaces for this operator so operator -> estate -> spaces/estate_id
  const { data: operator } = useQueryApi<ZoHouse>(
    "CAS_OPERATORS",
    {
      enabled: form.getFieldValue("operator") != undefined,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${form.getFieldValue("operator")}/`
  );

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

  const handleOnClose = () => {
    const hasValidFormData = () => {
      // Create a copy of the form
      const filteredFormData = { ...form.getFieldsValue(true) };

      // Delete default keys only if they exist
      ["start_at", "end_at", "status"].forEach((key) => {
        if (filteredFormData.hasOwnProperty(key)) {
          delete filteredFormData[key];
        }
      });

      return isValidObject(filteredFormData);
    };

    const hasCustomQuestions = customQuestions.length > 0;
    const hasCustomTickets = customTickets.length > 0;

    const isThereSomeSavedData =
      hasValidFormData() || hasCustomQuestions || hasCustomTickets;

    if (isThereSomeSavedData && !event) {
      showSaveDraftModal();
    } else {
      handleOnCloseActions();
    }
  };

  const handleOnCloseActions = () => {
    setCoverImage(null);
    setCustomQuestions([]);
    setScreen(1);
    form.resetFields();
    setCustomTickets([]);
    setEvent(null);
    onClose();
  };

  const { mutate: updateInventory } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );
  const { mutate: createInventory } = useMutationApi("CAS_INVENTORY");
  const { mutate: createAllowlist } = useMutationApi("CAS_ALLOWLISTS");
  const { mutate: createEligibility } = useMutationApi("CAS_ELIGIBILITY");
  const { mutateAsync: createTicket } = useMutationApi("CAS_SKU");
  const { mutateAsync: uploadMedia } = useMutationApi("CAS_MEDIA");
  const { mutateAsync: createQuestionare } =
    useMutationApi("CAS_QUESTIONNAIRES");

  const handleAddCustomTicket = (ticket: CustomTicket) => {
    setCustomTickets((prev) => [...prev, ticket]);
  };

  const createEvent = (data: GeneralObject) => {
    const formData = form.getFieldsValue();
    createInventory(
      {
        data: data,
      },
      {
        onSuccess(data) {
          const eventDetails: Inventory = data.data;
          setEvent(eventDetails);

          if (formData.hosts && formData.hosts.length > 0) {
            const uniqueHosts = Array.from(new Set(formData.hosts));
            updateInventory({
              data: {
                hosts: uniqueHosts,
              },
              route: `${eventDetails.id}/hosts/replace-all/`,
            });
          }

          if (coverImage) {
            updateMedia(`inventory/${eventDetails.id}/`, coverImage);
          }

          createQuestionare(
            {
              data: { title: `${formData.name}_Custom_Questions` },
            },
            {
              onSuccess: (questionareDetails) => {
                updateInventory({
                  data: { questionnaire: questionareDetails.data.id },
                  route: `${eventDetails.id}/`,
                });

                customQuestions.forEach((question: CustomQuestion) => {
                  const _options = question.choices
                    ? question.choices.filter((option: string) => option !== "")
                    : [];
                  createQuestionare({
                    data: {
                      text: question.text,
                      format: question.format,
                      choices: _options.map((option: string) => ({
                        label: formatCapitalize(option),
                        value: option,
                      })),
                    },
                    route: `${questionareDetails.data.id}/questions/`,
                  });
                });
              },
            }
          );

          createAllowlist(
            {
              data: {
                name: `${formData.name}_AllowList`,
                num_spots: 0,
                max_application_spots: 0,
                start_time: formData.start_at,
                end_time: formData.end_at,
                data: {},
              },
            },
            {
              onSuccess(data) {
                const allowListData: AllowList = data.data;
                createEligibility(
                  {
                    data: {
                      title: `${formData.name}_Criteria`,
                      description: `Criteria for registering in ${formData.name}`,
                      allowlist: allowListData.id,
                    },
                  },
                  {
                    onSuccess: (data, variables, context) => {
                      const eligibilityData: CASEligibilityResponse = data.data;
                      if (customTickets.length > 0) {
                        customTickets.map((ticket) => {
                          createTicket(
                            {
                              data: {
                                name: ticket.name,
                                specifications: {},
                                data: {},
                                price: +ticket.price || 0,
                                slabs: [],
                                units: +ticket.units || 0,
                                sellable: true,
                                inventory: eventDetails.id,
                                eligibility_criteria: [eligibilityData.id],
                                has_infinite_units: ticket.hasInfiniteUnits,
                              },
                            },
                            {}
                          );
                        });
                      }

                      message.success("Event Created");
                      queryClient.invalidateQueries({
                        queryKey: ["cas", "inventory"],
                      });
                      setScreen(4);
                      clearSavedDraft();
                      form.resetFields();
                    },
                    onError(error) {
                      message.error(processResponseError(error));
                    },
                  }
                );
              },
            }
          );
        },
      }
    );
  };

  const handleDeleteCustomTicket = (ticket: CustomTicket) => {
    setCustomTickets(
      customTickets.filter((element) => element.name !== ticket.name)
    );
  };

  const updateMedia = async (route: string, imageData: ImageUploaderFile) => {
    if (imageData) {
      const form = new FormData();
      form.append("file", imageData.image);
      form.append("category", "image");
      form.append(
        "metadata",
        JSON.stringify({
          alt: imageData.alt,
          title: imageData.title,
          description: imageData.description,
        })
      );
      await uploadMedia(
        {
          data: form,
          route: route,
        },
        {
          onSuccess: console.log,
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  const nextScreenHandler = async (form: FormInstance) => {
    try {
      // Get all form values first
      const values = form.getFieldsValue(true);

      await form.validateFields();

      if (screen === 3) {
        const body = removeUndefinedKeys({
          category: values.category,
          type: "activity",
          status: "active",
          applicable_taxes: ["country_tax", "state_tax"],
          tax_category: "misc",
          vendor: null,
          name: values.name,
          description: values.description,
          sort_index: values.sort_index,
          node: values.node,
          data: {
            email: values.email,
            link: values.link,
            subcategory: values.subcategory,
            price: values.price,
            latitude: values.latitude,
            location: values.location,
            longitude: values.longitude,
            navigation_link: values.navigation_link,
            registration_link: values.registration_link,
            icon: values.icon,
          },
          operator: values.operator,
          start_at: values.start_at
            ? dayjs(values.start_at).format("YYYY-MM-DDTHH:mm:ssZ")
            : dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          end_at: values.end_at
            ? dayjs(values.end_at).format("YYYY-MM-DDTHH:mm:ssZ")
            : dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm:ssZ"),
        });
        return createEvent(body);
      }

      if (screen < NO_OF_SCREENS) {
        // Store current form values before screen change
        const currentValues = form.getFieldsValue(true);
        setScreen((prev) => {
          const nextScreen = prev + 1;
          // Preserve form values after screen change
          setTimeout(() => {
            form.setFieldsValue(currentValues);
          }, 0);
          return nextScreen;
        });
        return;
      }
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const previousScreenHandler = () => {
    if (screen <= 1) {
      return;
    }
    setScreen((prev) => prev - 1);
  };

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
    },
    {
      name: "operator",
      label: "Operator",
      type: "select",
      options: allOperatorOptions || [],
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
      initialValue: new Date(),
    },
    {
      name: "end_at",
      label: "Ends At",
      type: "datetime",
      required: true,
    },

    {
      name: "price",
      label: "Price",
      type: "text",
      isHidden: eventCategory !== "listing",
      currency: operator?.currency,
    },
    {
      name: "location",
      label: "Location",
      type: "text",
    },
    {
      name: "latitude",
      label: "Latitude",
      type: "number",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "longitude",
      label: "Longitude",
      type: "number",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "navigation_link",
      label: "Navigation Link",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "registration_link",
      label: "Registration Link",
      type: "text",
      isHidden: eventCategory !== "listing",
    },
    {
      name: "icon",
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

  useEffect(() => {
    if (coverImage && coverImage.image) {
      const objectUrl = URL.createObjectURL(coverImage.image);
      setCoverPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setCoverPreviewUrl(null);
    }
  }, [coverImage]);

  useEffect(() => {
    if (startAt) {
      const currentTime = dayjs(startAt).isValid() ? dayjs(startAt) : dayjs();
      form.setFieldValue("end_at", currentTime.add(1, "hour"));
    }
  }, [startAt]);

  const eventlink = useMemo(() => {
    if (event) {
      return `${process.env.WEB_BASE_URL}/events/${slugify(
        event.name.split(" ").join("-").toLowerCase()
      )}-${event.pid}`;
    } else {
      return "";
    }
  }, [event]);

  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions((prev: CustomQuestion[]) =>
      prev.filter((question: CustomQuestion) => question.id !== id)
    );
  };

  const handleShowEventInfo = () => {
    if (event?.id) {
      router.push(`/events/${event.id}/edit`, undefined, {
        shallow: true,
      });
      setTimeout(() => {
        handleOnClose();
      }, 500);
    }
  };

  const nextButtonLabel = useMemo(() => {
    if (screen === 1) {
      return "Add Questions";
    }

    if (screen === 2) {
      return "Add Tickets";
    }

    if (screen === 3) {
      return "Create Event";
    }

    return "Next";
  }, [screen]);

  const saveDraft = () => {
    if (!user) {
      message.error("User not found");
      return;
    }

    // Get all form values including untouched fields
    const formValues = form.getFieldsValue(true);

    const draftData = {
      formValues,
      customQuestions,
      customTickets,
      coverImage,
      screen,
    };

    // Only save if there's actual data
    if (
      Object.keys(formValues).length > 0 ||
      customQuestions.length > 0 ||
      customTickets.length > 0
    ) {
      try {
        localStorage.setItem(
          `${DRAFT_KEY_PREFIX}-${user.pid}`,
          JSON.stringify(draftData)
        );
        setDraftExists(true);
        message.success("Draft saved successfully");
        hideSaveDraftModal();
        handleOnCloseActions();
      } catch (error) {
        console.error("Error saving draft:", error);
        message.error("Failed to save draft");
      }
    }
  };

  const loadDraft = () => {
    if (!user) {
      message.error("User not found");
      return;
    }

    try {
      const savedDraft = localStorage.getItem(
        `${DRAFT_KEY_PREFIX}-${user.pid}`
      );
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);

        // Restore form values
        if (draftData.formValues) {
          form.setFieldsValue(draftData.formValues);
        }

        // Restore custom questions
        if (draftData.customQuestions) {
          setCustomQuestions(draftData.customQuestions);
        }

        // Restore custom tickets
        if (draftData.customTickets) {
          setCustomTickets(draftData.customTickets);
        }

        // Restore cover image
        if (draftData.coverImage) {
          setCoverImage(draftData.coverImage);
        }

        // Restore screen
        if (draftData.screen) {
          setScreen(draftData.screen);
        }

        message.success("Draft loaded successfully");
        setDraftExists(false);
        hideLoadDraftModal();
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      message.error("Failed to load draft");
    }
  };

  const clearSavedDraft = () => {
    if (!user) return;

    try {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}-${user.pid}`);
      setDraftExists(false);
      message.success("Draft deleted successfully");
    } catch (error) {
      console.error("Error clearing draft:", error);
      message.error("Failed to delete draft");
    }
    hideLoadDraftModal();
  };

  const checkForDraft = () => {
    if (!user) return;

    try {
      const savedDraft = localStorage.getItem(
        `${DRAFT_KEY_PREFIX}-${user.pid}`
      );
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        // Only show draft modal if there's actual data
        if (
          Object.keys(draftData.formValues || {}).length > 0 ||
          (draftData.customQuestions || []).length > 0 ||
          (draftData.customTickets || []).length > 0
        ) {
          setDraftExists(true);
          showLoadDraftModal();
        }
      }
    } catch (error) {
      console.error("Error checking for draft:", error);
    }
  };

  // Check for draft when sidebar opens
  useEffect(() => {
    if (isOpen) {
      checkForDraft();
    }
  }, [isOpen]);

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={handleOnClose}
        size="large"
        title={
          !isMobile ? (
            <div className="flex items-center gap-4">
              {screen !== 1 && screen !== 4 && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={previousScreenHandler}
                  disabled={screen === 1}
                  type="text"
                />
              )}
              <span>{getEventTitle(screen, form.getFieldsValue())}</span>
            </div>
          ) : undefined
        }
        extra={
          screen !== 4 && (
            <Button type="primary" onClick={nextScreenHandler.bind(null, form)}>
              {nextButtonLabel}
            </Button>
          )
        }
      >
        {isMobile && (
          <SidebarMobileHeader
            onBackClick={previousScreenHandler}
            onClose={handleOnClose}
            title={getEventTitle(screen, form)}
            isBackButtonHidden={screen === 1 || screen === 4}
          />
        )}

        {operator && !operator.currency && (
          <Alert
            message="Warning"
            description="Selected operator does not have currency information configured. This may affect ticket pricing."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {screen === 1 ? (
          <Flex gap="24px">
            <div className="flex flex-col flex-1 md:max-w-[50%] gap-6">
              <Typography.Text
                type="secondary"
                style={{ textTransform: "uppercase", fontSize: "16px" }}
              >
                Booking Info
              </Typography.Text>
              <Form formFields={formFields} formData={form} />
            </div>
            <div className="flex flex-col flex-1 gap-6">
              <Typography.Text
                type="secondary"
                style={{ textTransform: "uppercase", fontSize: "16px" }}
              >
                Cover Image
              </Typography.Text>
              {coverpreviewUrl ? (
                <div className="relative w-full aspect-video flex-1 max-h-[180px]">
                  <Tag color="warning" className="absolute top-2 left-2">
                    Cover Image
                  </Tag>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setCoverPreviewUrl(null);
                      setCoverImage(null);
                    }}
                    className="absolute top-2 right-2"
                  />
                  <img
                    className="h-full w-full object-cover"
                    src={coverpreviewUrl}
                    alt={coverImage?.alt || ""}
                  />
                </div>
              ) : (
                <Flex
                  vertical
                  align="center"
                  justify="center"
                  onClick={showImagePicker}
                  className="flex-1 relative w-full aspect-video bg-zui-light border border-dashed border-zui-silver rounded-md cursor-pointer max-h-[180px]"
                >
                  <PhotoOutlinedIcon sx={{ color: "#5a5a5a" }} />
                  <Typography.Text
                    type="secondary"
                    className="text-center mt-2"
                  >
                    Upload Image <br /> Must be in Ratio 16:9
                  </Typography.Text>
                </Flex>
              )}
            </div>
          </Flex>
        ) : screen === 2 ? (
          <Flex vertical gap={10} className="pb-6">
            <div className="w-full flex-1">
              <Typography.Title
                level={5}
                className="text-zui-silver uppercase my-4"
              >
                Add Custom Questions
              </Typography.Title>

              <Button
                icon={<AddOutlined />}
                onClick={showCustomQuestionSidebar}
                className="w-full md:w-fit mt-6"
              >
                Question
              </Button>

              <Flex vertical gap="small" className="w-full md:w-1/2 mt-4">
                {customQuestions.map((question: CustomQuestion) => (
                  <Flex
                    key={question.id}
                    vertical
                    gap="middle"
                    className="w-full bg-zui-light p-4 relative rounded-md shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="absolute top-4 right-4 hover:text-red-500 transition-colors"
                    />
                    <Typography.Text strong className="pr-8">
                      {question.text}
                    </Typography.Text>
                    {question.choices && (
                      <Flex wrap gap="small">
                        {question.choices.map(
                          (option: string, index: number) => (
                            <Tag
                              key={index}
                              className="px-3 py-1 border border-zui-silver rounded-full"
                            >
                              {option}
                            </Tag>
                          )
                        )}
                      </Flex>
                    )}
                    <Tag className="px-4 py-1 border border-zui-lighter text-sm capitalize w-fit">
                      {CustomQuestionTypesMap[question.format] ||
                        question.format}
                    </Tag>
                  </Flex>
                ))}
              </Flex>
            </div>
          </Flex>
        ) : screen === 3 ? (
          <Flex
            justify="space-between"
            align="flex-start"
            gap={20}
            style={{ flexGrow: 1 }}
          >
            <Flex vertical align="flex-start" style={{ width: "100%" }}>
              <div style={{ width: "100%", maxWidth: "33.333%" }}>
                <Typography.Title
                  level={5}
                  style={{
                    color: "#9CA3AF",
                    marginBottom: 16,
                    textTransform: "uppercase",
                  }}
                >
                  Create Tickets
                </Typography.Title>

                <Button
                  icon={<AddOutlined />}
                  onClick={showAddTicketSidebar}
                  style={{ marginBottom: 16 }}
                >
                  Add Ticket
                </Button>

                {customTickets.length > 0 && (
                  <Flex vertical gap="small">
                    {customTickets.map((ticket) => (
                      <div
                        className="bg-zui-light p-4 rounded-md"
                        key={ticket.id}
                      >
                        <Flex justify="space-between" align="center">
                          <Typography.Text strong>
                            {ticket.name}
                          </Typography.Text>
                          <Button
                            type="text"
                            icon={<DeleteOutlinedIcon fontSize={"small"} />}
                            onClick={() => handleDeleteCustomTicket(ticket)}
                          />
                        </Flex>
                        <Typography.Text type="secondary" className="text-sm">
                          {ticket.hasInfiniteUnits ? (
                            <span>Unlimited Tickets</span>
                          ) : (
                            <span>{ticket.units} Tickets</span>
                          )}
                          {" at ₹"}
                          {+ticket.price *
                            Math.pow(
                              10,
                              operator?.currency
                                ? -operator.currency.decimals
                                : 0
                            )}
                        </Typography.Text>
                      </div>
                    ))}
                  </Flex>
                )}
              </div>
            </Flex>
          </Flex>
        ) : screen === 4 ? (
          <>
            <motion.div
              className="flex items-center justify-center min-h-[60vh]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col items-center justify-center gap-6 max-w-md text-center">
                <motion.div
                  className="flex flex-col items-center gap-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircleOutlined
                    style={{ fontSize: 72, color: "#52c41a" }}
                  />
                  <div>
                    <Typography.Title level={2}>
                      Event Created Successfully!
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      Your event has been created and is now live.
                    </Typography.Text>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-col gap-4 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    icon={<VisibilityOutlined />}
                    disabled={!isValidObject(event)}
                    onClick={handleShowEventInfo}
                    className="w-fit mx-auto"
                    type="primary"
                  >
                    View Event Details
                  </Button>

                  <Card size="small" className="text-center">
                    <Typography.Text type="secondary" className="block mb-2">
                      Event Link
                    </Typography.Text>
                    <a
                      href={eventlink.toLowerCase()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {eventlink.toLowerCase()}
                    </a>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Typography.Text type="secondary" className="text-sm">
                    <InfoOutlined className="mr-2" />
                    You can share this link with your attendees or manage the
                    event from your dashboard
                  </Typography.Text>
                </motion.div>
              </div>
            </motion.div>
          </>
        ) : null}

        {screen === 3 && operator?.currency && (
          <AddTicket
            addTicket={handleAddCustomTicket}
            isOpen={isAddTicketVisible}
            onClose={hideAddTicketSidebar}
            currency={operator?.currency}
          />
        )}

        <ImageUploaderSidebar
          isOpen={isImagePickerVisible}
          onClose={hideImagePicker}
          onSelect={setCoverImage}
        />
        {screen === 2 && (
          <CustomQuestionSidebar
            isOpen={isCustomQuestionSidebarVisible}
            onClose={hideCustomQuestionSidebar}
            setQuestions={setCustomQuestions}
          />
        )}
        <CreateEventNodeSidebar
          isOpen={isNodeSidebarVisible}
          onClose={hideNodeSidebar}
          onSuccess={() => {
            form.setFieldValue("node", "searchselect");
          }}
        />
      </Drawer>
      {/* load draft modal */}
      <Modal
        open={isLoadDraftModalOpen}
        onCancel={() => {
          hideLoadDraftModal();
          setDraftExists(false);
        }}
        title="Load Saved Draft"
        footer={[
          <Button key="delete" danger onClick={clearSavedDraft}>
            Delete Draft
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              hideLoadDraftModal();
              setDraftExists(false);
            }}
          >
            Cancel
          </Button>,
          <Button key="load" type="primary" onClick={loadDraft}>
            Load Draft
          </Button>,
        ]}
      >
        <Typography.Text>
          A previously saved draft was found. Would you like to load it?
        </Typography.Text>
      </Modal>

      {/* save draft modal */}
      <Modal
        open={isSaveDraftModalOpen}
        onCancel={hideSaveDraftModal}
        title="Save Draft"
        footer={[
          <Button
            key="no"
            onClick={() => {
              hideSaveDraftModal();
              handleOnCloseActions();
            }}
          >
            Don't Save
          </Button>,
          <Button key="save" type="primary" onClick={saveDraft}>
            Save Draft
          </Button>,
        ]}
      >
        <Typography.Text>
          Would you like to save your progress as a draft? Any previously saved
          draft will be replaced.
        </Typography.Text>
      </Modal>
    </>
  );
};

export default AddEventSidebar;
