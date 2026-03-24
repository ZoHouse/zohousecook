import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { isValidUUID } from "@zo/utils/string";
import { Spin } from "antd";
import React, { useMemo } from "react";
import ItineraryDetailsSection from "./ItineraryDetailsSection";

interface TripItineraryDetailProps {
  selectedItinerary: string;
  isActive: boolean;
}

const TripItineraryDetail: React.FC<TripItineraryDetailProps> = ({
  selectedItinerary,
  isActive,
}) => {
  const {
    data: tripExclusions,
    refetch: refetchExclusions,
    isLoading: isExclusionsLoading,
  } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) => data.data,
    },
    `${selectedItinerary}/exclusions/`,
    "limit=-1"
  );

  const {
    data: tripHighlights,
    refetch: refetchHighlights,
    isLoading: isHighlightsLoading,
  } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) => data.data,
    },
    `${selectedItinerary}/highlights/`,
    "limit=-1"
  );

  const {
    data: tripInclusions,
    refetch: refetchInclusions,
    isLoading: isInclusionsLoading,
  } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) => data.data,
    },
    `${selectedItinerary}/inclusions/`,
    "limit=-1"
  );

  const {
    data: tripEssentials,
    refetch: refetchEssentials,
    isLoading: isEssentialsLoading,
  } = useQueryApi<GeneralObject[]>(
    "CAS_ESSENTIALS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) =>
        data.data.map((item: any) => ({
          id: item.id,
          sort_index: item.sort_index,
          description: item.essential.description,
          icon: item.essential.icon,
        })),
    },
    `${selectedItinerary}/required-essentials/`,
    "limit=-1"
  );

  const {
    data: tripFaqs,
    refetch: refetchFaqs,
    isLoading: isFaqsLoading,
  } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) => data.data,
    },
    `${selectedItinerary}/faqs/`,
    "limit=-1"
  );

  // Memoized loading state
  const isLoading = useMemo(() => {
    return (
      isExclusionsLoading ||
      isHighlightsLoading ||
      isInclusionsLoading ||
      isEssentialsLoading ||
      isFaqsLoading
    );
  }, [
    isExclusionsLoading,
    isHighlightsLoading,
    isInclusionsLoading,
    isEssentialsLoading,
    isFaqsLoading,
  ]);

  // Configuration for all cards
  const allCards = useMemo(
    () => [
      {
        title: "Inclusion",
        items: tripInclusions || [],
        section: "inclusion",
        baseRoute: "inclusions",
        refetch: refetchInclusions,
      },
      {
        title: "Exclusion",
        items: tripExclusions || [],
        section: "exclusion",
        baseRoute: "exclusions",
        refetch: refetchExclusions,
      },
      {
        title: "Highlights",
        items: tripHighlights || [],
        section: "highlights",
        baseRoute: "highlights",
        refetch: refetchHighlights,
      },
      {
        title: "Essentials",
        items: tripEssentials || [],
        section: "essentials",
        baseRoute: "required-essentials",
        refetch: refetchEssentials,
        gridClass: "md:col-span-1",
      },
      {
        title: "FAQs",
        items: tripFaqs || [],
        section: "faq",
        baseRoute: "faqs",
        refetch: refetchFaqs,
        gridClass: "md:col-span-2",
      },
    ],
    [
      tripInclusions,
      tripExclusions,
      tripHighlights,
      tripEssentials,
      tripFaqs,
      refetchInclusions,
      refetchExclusions,
      refetchHighlights,
      refetchEssentials,
      refetchFaqs,
    ]
  );

  return (
    <>
      <PageHeader title="Itinerary Details" />
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allCards.map((card) => {
                const gridClass = card.gridClass || "";
                return (
                  <div key={card.section} className={`${gridClass}`}>
                    <ItineraryDetailsSection
                      title={card.title}
                      items={card.items}
                      section={card.section}
                      selectedItinerary={selectedItinerary}
                      baseRoute={card.baseRoute}
                      refetch={card.refetch}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
};

export default TripItineraryDetail;
