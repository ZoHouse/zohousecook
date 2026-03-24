import { InferGetServerSidePropsType } from "next";
import "react-spring-bottom-sheet/dist/style.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import "swiper/swiper-bundle.css";
import { MetaTags } from "../../components/common";

import { useQueryApi } from "@zo/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import {
    CommunityVibeSection,
    Footer,
    HeroSection,
    SfoGallery,
    TwitterBanner,
    ZoHouseGallery,
    ZoParty,
} from "../../components/helpers/san-francisco";

import moment from "moment";
import { useMemo, useState } from "react";
import ViewEventsModal from "../../components/helpers/san-francisco/ViewEvents";
import { BookingExperienceResponse } from "../../config";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import { fetchMetaData as getServerSideProps } from "../../components/utils";
export { getServerSideProps };

const Index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isViewAllEventsOpen, setIsViewAllEventsOpen] =
    useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] =
    useState<BookingExperienceResponse | null>(null);

  const { isLoading, data: eventsData } = useQueryApi<
    BookingExperienceResponse[]
  >(
    "BOOKINGS_EXPERIENCE_OPERATORS",
    {
      select: (data) => {
        const allEvents: BookingExperienceResponse[] = data.data.results;

        const allEventsWithValidPoints = allEvents.filter(
          (e) =>
            !isNaN(e.latitude) && !isNaN(e.longitude) && e.status === "active"
        );
        return allEventsWithValidPoints;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: isValidString(process.env.ZOHOUSE_SFO_PID),
    },
    `${process.env.ZOHOUSE_SFO_PID}/inventory`,
    `start_at__gte=${moment().format("yyyy-MM-DD")}`
  );


  const dateOptions = useMemo(() => {
    if (eventsData) {
      const dates = Array.from(
        new Set(
          eventsData
            ?.map((event) => moment(event.start_at).format("YYYY-MM-DD"))
            .concat(moment().format("YYYY-MM-DD"))
        )
      )
        .sort((a, b) => moment(a).valueOf() - moment(b).valueOf())
        .map((date) => {
          return {
            label: moment(date).isSame(moment(), "date")
              ? "Today"
              : moment(date).isSame(moment().add(1, "day"), "date")
              ? "Tomorrow"
              : moment(date).format("DD MMM, ddd"),
            value: date,
          };
        });

      if (!dates.find((d) => d.label === "Today")) {
        dates?.unshift();
      }
      dates?.unshift({
        label: "All Dates",
        value: "all",
      });

      console.log("Date options:", dates);

      return dates;
    } else {
      return [];
    }
  }, [eventsData]);

  const categoryOptions = useMemo(() => {
    if (eventsData) {
      const categories = Array.from(
        new Set(eventsData?.map((event) => event.subcategory))
      )
        .map((subcategory) => {
          if (subcategory) {
            return {
              label: formatCapitalize(subcategory),
              value: subcategory,
            };
          }
        })
        .filter(
          (category): category is { label: string; value: string } =>
            category !== undefined
        ); // Filter out undefined values

      categories?.unshift({
        label: "All Events",
        value: "All",
      });
      return categories;
    } else {
      return [];
    }
  }, [eventsData]);

  // Filter events based on the search term
  const filteredEvents = useMemo(() => {
    const filtered = eventsData?.filter((event) => {
      const eventStartDate = moment(event.start_at);
      const eventEndDate = moment(event.end_at);
      const isCategoryMatch =
        selectedCategory === "All"
          ? true
          : event.subcategory?.toLowerCase() === selectedCategory.toLowerCase();

      const isDateMatch =
        selectedDate !== "all"
          ? moment(selectedDate).isBetween(
              eventStartDate,
              eventEndDate,
              "date",
              "[]"
            )
          : true;

      return isCategoryMatch && isDateMatch;
    });

    return searchTerm.length > 0
      ? filtered?.filter((event) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filtered;
  }, [eventsData,  searchTerm, selectedCategory, selectedDate]);

  return (
    <>
      <HeroSection
        categoryOptions={categoryOptions || []}
        dateOptions={dateOptions || []}
        eventsData={filteredEvents || []}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedDate={selectedDate}
        setSearchTerm={setSearchTerm}
        setSelectedCategory={setSelectedCategory}
        setSelectedDate={setSelectedDate}
        setIsViewAllEventsOpen={setIsViewAllEventsOpen}
        setSelectedEvent={setSelectedEvent}
        selectedEvent={selectedEvent}
      />
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />

      <div className="mx-auto max-w-[1400px] w-full lg:px-[108px]">
        <SfoGallery />

        <ZoHouseGallery />
        <TwitterBanner />
        <ZoParty
          setIsViewAllEventsOpen={setIsViewAllEventsOpen}
          data={filteredEvents || []}
        />
        <CommunityVibeSection />
        <Footer />
      </div>
      <ViewEventsModal
        isOpen={isViewAllEventsOpen}
        onClose={setIsViewAllEventsOpen.bind(null, false)}
        categoryOptions={categoryOptions || []}
        dateOptions={dateOptions || []}
        eventsData={filteredEvents || []}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedDate={selectedDate}
        setSearchTerm={setSearchTerm}
        setSelectedCategory={setSelectedCategory}
        setSelectedDate={setSelectedDate}
        setSelectedEvent={setSelectedEvent}
        selectedEvent={selectedEvent}
      />
    </>
  );
};

export default Index;