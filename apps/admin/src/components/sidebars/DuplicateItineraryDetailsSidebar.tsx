import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidString, isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Policy } from "../../config";
import { Form, FormElement } from "../Form";

// Types
interface Media {
  id: string;
  category: string;
  url: string;
  sort_index: number;
  metadata: {
    alt: string;
    title: string;
  };
}

interface DuplicateItineraryDetailsSidebarProps {
  onClose: () => void;
  isOpen: boolean;
  selectedItinerary: string;
}

interface OptionConfig {
  label: string;
  value: string;
}

// Constants
const categoryConfigs: OptionConfig[] = [
  { label: "Stops", value: "stops" },
  { label: "Photos", value: "photos" },
  { label: "Policy", value: "policy" },
  { label: "Details", value: "details" },
];

const detailSection: OptionConfig[] = [
  { label: "Inclusions", value: "inclusions" },
  { label: "Exclusions", value: "exclusions" },
  { label: "FAQs", value: "faqs" },
  { label: "Highlights", value: "highlights" },
  { label: "Essentials", value: "essentials" },
];

const DuplicateItineraryDetailsSidebar: React.FC<
  DuplicateItineraryDetailsSidebarProps
> = ({ onClose, isOpen, selectedItinerary }) => {
  // Form and state management
  const [form] = useForm();
  const queryClient = useQueryClient();
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(
    null
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  // Utility function for media relation payload
  const getCopyMediaRelationBody = useCallback(
    (
      media: Media[],
      relationType: string,
      relationId: string
    ): { media_ids: string[]; relation_type: string; relation_id: string } => {
      const uniqueMediaIds = [...new Set(media.map((item: Media) => item.id))];
      return {
        media_ids: uniqueMediaIds,
        relation_type: relationType,
        relation_id: relationId,
      };
    },
    []
  );

  // Backup effect to monitor form changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTripValue = form.getFieldValue("trip");
      const currentItineraryValue = form.getFieldValue("itinerary");

      if (currentTripValue && currentTripValue !== selectedTrip) {
        setSelectedTrip(currentTripValue);
      }

      if (
        currentItineraryValue &&
        currentItineraryValue !== selectedItineraryId
      ) {
        setSelectedItineraryId(currentItineraryValue);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedTrip, selectedItineraryId, form]);

  // API Queries - Only enabled when needed
  const shouldFetchTripData = useMemo(
    () => isValidString(selectedTrip) && isOpen,
    [selectedTrip, isOpen]
  );

  const { data: itineraries } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchTripData,
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
    },
    ``,
    `inventory=${selectedTrip}`
  );

  const { data: tripStops, refetch: refetchTripStops } = useQueryApi<any[]>(
    "CAS_ITINERARY_STOPS",
    {
      enabled:
        isValidUUID(selectedItineraryId) &&
        selectedCategories.includes("stops"),
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
    },
    ``,
    `itinerary=${selectedItineraryId}`
  );

  const { data: itineraryMedia, refetch: refetchMedia } = useQueryApi<any[]>(
    "CAS_MEDIA",
    {
      enabled:
        isValidUUID(selectedItineraryId) &&
        selectedCategories.includes("photos"),
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
    },
    `itinerary/${selectedItineraryId}/`,
    `ordering=-created_at`
  );

  const { data: itineraryPolicies, refetch: refetchPolicies } = useQueryApi<
    Policy[]
  >(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled:
        isValidUUID(selectedItineraryId) &&
        selectedCategories.includes("policy"),
      select: (data) => data.data.results as Policy[],
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/policies/`,
    "limit=100"
  );

  // Detail section queries - only when details is selected
  const shouldFetchDetails = useMemo(
    () =>
      isValidUUID(selectedItineraryId) &&
      selectedCategories.includes("details"),
    [selectedItineraryId, selectedCategories]
  );

  const { data: tripExclusions, refetch: refetchExclusions } = useQueryApi<
    GeneralObject[]
  >(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchDetails,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/exclusions/`,
    "limit=-1"
  );

  const { data: tripHighlights, refetch: refetchHighlights } = useQueryApi<
    GeneralObject[]
  >(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchDetails,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/highlights/`,
    "limit=-1"
  );

  const { data: tripInclusions, refetch: refetchInclusions } = useQueryApi<
    GeneralObject[]
  >(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchDetails,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/inclusions/`,
    "limit=-1"
  );

  const { data: tripEssentials, refetch: refetchEssentials } = useQueryApi<
    GeneralObject[]
  >(
    "CAS_ESSENTIALS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchDetails,
      select: (data) =>
        data.data.map((item: any) => ({
          id: item.id,
          sort_index: item.sort_index,
          description: item.essential.description,
          icon: item.essential.icon,
        })),
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/required-essentials/`,
    "limit=-1"
  );

  const { data: tripFaqs, refetch: refetchFaqs } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: shouldFetchDetails,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/faqs/`,
    "limit=-1"
  );

  // Mutation APIs
  const { mutate: createItineraries, isLoading: isCreatingItineraries } =
    useMutationApi("CAS_ITINERARY_STOPS", {}, "", "POST");

  const { mutate: createDuplicateMedia, isLoading: isCreatingDuplicateMedia } =
    useMutationApi("CAS_MEDIA_DUPLICATE", {}, "", "POST");

  const { mutate: createTripPolicy, isLoading: isCreatingTripPolicy } =
    useMutationApi("CAS_INVENTORY_ITINERARIES", {}, "", "PUT");

  const { mutate: addDetails, isLoading: isAddingDetails } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    "POST"
  );

  const { mutate: addEssentials, isLoading: isAddingEssentials } =
    useMutationApi("CAS_ESSENTIALS_INVENTORY_ITINERARIES", {}, "", "POST");

  const duplicateStops = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripStops?.length) {
        message.info("No stops found in the source itinerary to duplicate");
        return;
      }

      try {
        for (let index = 0; index < tripStops.length; index++) {
          const originalStop = tripStops[index];

          // Prepare stop payload
          const stopPayload = {
            day: originalStop.day,
            title: originalStop.title,
            description: originalStop.description,
            itinerary: targetItineraryId,
          };

          // Create stop
          const stopResponse: any = await new Promise((resolve, reject) => {
            createItineraries(
              { data: stopPayload },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          });

          // After stop is created, copy media if exists
          if (stopResponse?.data?.id && originalStop.media?.length) {
            const mediaPayload = getCopyMediaRelationBody(
              originalStop.media,
              "itinerary_stop",
              stopResponse.data.id
            );

            await new Promise((resolve, reject) => {
              createDuplicateMedia(
                { data: mediaPayload },
                {
                  onSuccess: resolve,
                  onError: (error) => {
                    message.error(processResponseError(error));
                    reject(error);
                  },
                }
              );
            });
          }
        }

        // 🔁 Refetch all stops once at the end
        queryClient.invalidateQueries({ queryKey: ["cas", "itinerary-stops"] });
        queryClient.invalidateQueries({ queryKey: ["cas", "media"] });
        refetchTripStops();
      } catch (error) {
        message.error("Failed to duplicate stops.");
        throw error;
      }
    },
    [
      tripStops,
      createItineraries,
      createDuplicateMedia,
      getCopyMediaRelationBody,
      queryClient,
      refetchTripStops,
    ]
  );

  const duplicatePhotos = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!itineraryMedia?.length) {
        message.info("No media found in the source itinerary to duplicate");
        return;
      }

      try {
        const mediaPayload = getCopyMediaRelationBody(
          itineraryMedia,
          "itinerary",
          targetItineraryId
        );

        createDuplicateMedia(
          { data: mediaPayload },
          {
            onSuccess() {
              queryClient.invalidateQueries({
                queryKey: ["cas", "media"],
              });
              refetchMedia();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } catch (error) {
        throw error;
      }
    },
    [itineraryMedia, createDuplicateMedia, getCopyMediaRelationBody]
  );

  const duplicatePolicy = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!itineraryPolicies?.length) {
        message.info("No policies found in the source itinerary to duplicate");
        return;
      }

      try {
        const allPolicies = itineraryPolicies
          .filter((policy) => isValidString(policy.description))
          .map(({ title, icon, description, id, sort_index }) => ({
            title,
            icon,
            description,
            sort_index,
            id,
          }));

        createTripPolicy(
          {
            data: allPolicies,
            route: `${targetItineraryId}/policies/replace-all/`,
          },
          {
            onSuccess() {
              queryClient.invalidateQueries({
                queryKey: ["cas", "inventory-itineraries"],
              });
              refetchPolicies();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } catch (error) {
        throw error;
      }
    },
    [itineraryPolicies, createTripPolicy]
  );

  // Section handlers
  const duplicateInclusions = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripInclusions?.length) {
        return;
      }

      const bulkPayload = tripInclusions.map((item) => ({
        description: item.description,
        icon: item.icon,
      }));

      addDetails(
        {
          data: bulkPayload,
          route: `${targetItineraryId}/inclusions/bulk-create/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "inventory-itineraries"],
            });
            refetchInclusions();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    },
    [tripInclusions, addDetails]
  );

  const duplicateExclusions = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripExclusions?.length) {
        return;
      }

      const bulkPayload = tripExclusions.map((item) => ({
        description: item.description,
        icon: item.icon,
      }));

      addDetails(
        {
          data: bulkPayload,
          route: `${targetItineraryId}/exclusions/bulk-create/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "inventory-itineraries"],
            });
            refetchExclusions();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    },
    [tripExclusions, addDetails]
  );

  const duplicateHighlights = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripHighlights?.length) {
        return;
      }

      const bulkPayload = tripHighlights.map((item) => ({
        description: item.description,
        icon: item.icon,
      }));

      addDetails(
        {
          data: bulkPayload,
          route: `${targetItineraryId}/highlights/bulk-create/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "inventory-itineraries"],
            });
            refetchHighlights();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    },
    [tripHighlights, addDetails]
  );

  const duplicateFaqs = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripFaqs?.length) {
        return;
      }

      const bulkPayload = tripFaqs.map((item) => ({
        description: item.description,
        icon: item.icon,
        title: item.title,
      }));

      addDetails(
        {
          data: bulkPayload,
          route: `${targetItineraryId}/faqs/bulk-create/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "inventory-itineraries"],
            });
            refetchFaqs();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    },
    [tripFaqs, addDetails]
  );

  const duplicateEssentials = useCallback(
    async (targetItineraryId: string): Promise<void> => {
      if (!tripEssentials?.length) {
        return;
      }

      tripEssentials.forEach((item) => {
        addEssentials(
          {
            data: {
              description: item.description,
              icon: item.icon,
              name: item.description,
            },
            route: `/${targetItineraryId}/required-essentials/new/`,
          },
          {
            onSuccess() {
              queryClient.invalidateQueries({
                queryKey: ["cas", "essentials", "inventory-itineraries"],
              });
              refetchEssentials();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      });
    },
    [tripEssentials, addEssentials]
  );

  const sectionHandlers = useMemo(
    () => ({
      inclusions: duplicateInclusions,
      exclusions: duplicateExclusions,
      highlights: duplicateHighlights,
      faqs: duplicateFaqs,
      essentials: duplicateEssentials,
    }),
    [
      duplicateInclusions,
      duplicateExclusions,
      duplicateHighlights,
      duplicateFaqs,
      duplicateEssentials,
    ]
  );

  const duplicateDetails = useCallback(
    async (targetItineraryId: string, sections: string[]): Promise<void> => {
      if (!sections?.length) {
        message.warning("Please select at least one section to duplicate.");
        return;
      }

      const results = await Promise.allSettled(
        sections
          .filter(
            (section) =>
              sectionHandlers[section as keyof typeof sectionHandlers]
          )
          .map(async (section) => {
            try {
              const handler =
                sectionHandlers[section as keyof typeof sectionHandlers];
              await handler(targetItineraryId);
              return { section, success: true };
            } catch (error) {
              return { section, success: false, error };
            }
          })
      );

      const failed = results.filter(
        (result) =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && !result.value.success)
      );

      if (failed.length > 0) {
        throw new Error(`${failed.length} detail sections failed`);
      }
    },
    [sectionHandlers]
  );

  const handleClose = useCallback(() => {
    form.resetFields();
    setSelectedItineraryId(null);
    setSelectedCategories([]);
    setSelectedTrip(null);
    setSelectedItineraryId(selectedItinerary);
    onClose();
  }, [form, onClose, selectedItinerary]);

  const handleSaves = async () => {
    const {
      category: selectedCategories = [],
      sections: selectedSections = [],
    } = form.getFieldsValue();

    if (!selectedCategories.length) {
      message.warning("Please select at least one category to duplicate.");
      handleClose();
      return;
    }

    const categoryActions = {
      stops: () => duplicateStops(selectedItinerary),
      photos: () => duplicatePhotos(selectedItinerary),
      policy: () => duplicatePolicy(selectedItinerary),
      details: () => duplicateDetails(selectedItinerary, selectedSections),
    };

    // Execute duplications for selected categories
    await Promise.all(
      selectedCategories
        .filter(
          (category: keyof typeof categoryActions) => categoryActions[category]
        )
        .map((category: keyof typeof categoryActions) =>
          categoryActions[category]()
        )
    );

    handleClose();
  };

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (changedValues.trip) {
        setSelectedTrip(changedValues.trip);
        setSelectedCategories([]);
        form.setFieldsValue({
          itinerary: undefined,
          category: undefined,
          sections: undefined,
        });
      }

      if (changedValues.itinerary) {
        setSelectedItineraryId(changedValues.itinerary);
      }

      if (changedValues.category) {
        setSelectedCategories(changedValues.category || []);
      }
    },
    [form]
  );

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "trip",
        label: "Select Trip",
        type: "searchselect",
        searchQueryApi: "CAS_INVENTORY",
        selectedValueSelector(data) {
          return data?.id;
        },
        optionValueAndLabelSelector: (data) => ({
          value: data.id,
          label: data.name,
        }),
        responseFields: ["id", "name"],
        placeholder: "Search and select a trip...",
        rules: [
          { required: true, message: "Please select a trip" },
          {
            validator: async (_, value) => {
              if (value === selectedItinerary) {
                throw new Error("Cannot duplicate to the same itinerary");
              }
            },
          },
        ],
      },
      {
        name: "itinerary",
        label: "Select Itinerary",
        type: "select",
        options:
          itineraries?.map((itinerary) => ({
            label: itinerary.title,
            value: itinerary.id,
          })) || [],
        placeholder: "Select an itinerary...",
        rules: [{ required: true, message: "Please select an itinerary" }],
      },
      {
        name: "category",
        label: "Select Details",
        type: "multiSelect",
        options: categoryConfigs.map((config) => ({
          label: config.label,
          value: config.value,
        })),
        placeholder: "Select details...",
        rules: [
          { required: true, message: "Please select at least one detail" },
        ],
      },
      {
        name: "sections",
        label: "Select Sections",
        type: "multiSelect",
        options: detailSection.map((section) => ({
          label: section.label,
          value: section.value,
        })),
        placeholder: "Select sections to duplicate...",
        rules: [
          {
            required: true,
            message: "Please select at least one section",
            validator: async (_, value) => {
              const categories = form.getFieldValue("category") || [];
              if (
                categories.includes("details") &&
                (!value || value.length === 0)
              ) {
                throw new Error("Please select at least one section");
              }
            },
          },
        ],
        conditionallyRenderField: () => {
          return (
            isValidString(selectedItineraryId) &&
            selectedCategories.includes("details")
          );
        },
      },
    ],
    [
      selectedItinerary,
      itineraries,
      selectedItineraryId,
      selectedCategories,
      form,
    ]
  );

  return (
    <Drawer
      title="Duplicate Itinerary Details"
      open={isOpen}
      onClose={handleClose}
      width={500}
      extra={
        <Button
          type="primary"
          onClick={handleSaves}
          loading={
            isCreatingItineraries ||
            isCreatingDuplicateMedia ||
            isCreatingTripPolicy ||
            isAddingDetails ||
            isAddingEssentials
          }
          disabled={
            isCreatingItineraries ||
            isCreatingDuplicateMedia ||
            isCreatingTripPolicy ||
            isAddingDetails ||
            isAddingEssentials
          }
        >
          {isCreatingItineraries ||
          isCreatingDuplicateMedia ||
          isCreatingTripPolicy ||
          isAddingDetails ||
          isAddingEssentials
            ? "Duplicating..."
            : "Duplicate"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Form
          formData={form}
          formFields={formFields}
          onValueChange={handleFormValuesChange}
        />
      </div>
    </Drawer>
  );
};

export default DuplicateItineraryDetailsSidebar;
