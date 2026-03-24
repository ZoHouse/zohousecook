import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import mapboxgl, { LayerSpecification } from "mapbox-gl";
import moment, { Moment } from "moment-timezone";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookingExperienceResponse,
  BookingOperatorResponse,
} from "../../../config";
import cultureMarkers from "../../../config/token2049";
import { cn, rubikClassName } from "../../utils";
import EventSidebar from "../san-francisco/EventSidebar";
import ZoZoButton from "../san-francisco/ZoZoButton";
import CategoryFilter from "../singapore-event-map/CategoryFilter";
import DateFilter from "../singapore-event-map/DateFilter";
import { buildingLayer } from "../singapore-event-map/MapConfig";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // deg2rad below
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      (1 - Math.cos(dLon))) /
      2;

  return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
};

interface HeroSectionProps {
  eventsData: BookingExperienceResponse[];
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  selectedCategory: string;
  dateOptions: Array<{ label: string; value: string }>;
  categoryOptions: Array<{ label: string; value: string }>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setIsViewAllEventsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  isLoading: boolean;
  selectedEvent?: BookingExperienceResponse | null;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<BookingExperienceResponse | null>
  >;
  className?: string;
  initialCoordinates: {
    lng: number;
    lat: number;
  };
}

const HeroSection: React.FC<HeroSectionProps> = ({
  eventsData,
  categoryOptions,
  dateOptions,
  searchTerm,
  selectedCategory,
  selectedDate,
  setSearchTerm,
  setSelectedCategory,
  setSelectedDate,
  isLoading,
  setIsViewAllEventsOpen,
  setSelectedEvent,
  selectedEvent,
  className,
  initialCoordinates,
}) => {
  const { isMobile } = useWindowSize();
  const router = useRouter();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<HTMLElement[]>([]);

  const [userLocation, setUserLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(moment());
  const [operatorTime, setOperatorTime] = useState<Moment>(
    moment().utcOffset(-7)
  );
  const [isDay, setIsDay] = useState<boolean>(false);

  const [isAtZoHouse, setIsAtZoHouse] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(15);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: operator } = useQueryApi<BookingOperatorResponse>(
    "BOOKINGS_STAY_OPERATORS",
    {
      select: (data) => data.data,
      enabled: isValidString(router.query.slug?.[0]),
      refetchOnWindowFocus: false,
    },
    `${router.query.slug?.[0]}`
  );

  const [filteredEvents, setFilteredEvents] = useState<
    BookingExperienceResponse[]
  >([]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  }, []);

  function zoomToLocation(
    map: mapboxgl.Map,
    coordinates: {
      lng: number;
      lat: number;
    },
    zoomLevel: number = 15.5,
    pitch: number = 30,
    bearing: number = -30,
    duration: number = 1000,
    zoomOutLevel: number = 10 // New parameter for zoom out level
  ) {
    if (!map) return;

    // Fly to the specified location
    map.flyTo({
      center: coordinates, // focus on the given coordinates
      zoom: zoomLevel,
      pitch: pitch,
      bearing: bearing,
      duration: duration, // animation time in ms
      essential: true, // for accessibility reasons
    });
  }

  const showEventOnMap = useCallback(
    (event: BookingExperienceResponse) => {
      if (mapRef.current) {
        const points =
          !event.longitude && !event.latitude
            ? {
                lat: initialCoordinates.lat,
                lng: initialCoordinates.lng,
              }
            : { lat: +event.latitude, lng: +event.longitude };

        zoomToLocation(mapRef.current, points, 16);
      }
    },
    [initialCoordinates]
  );

  const scaleMarker = useCallback((index: number) => {
    // scale the index one to 1.5 and add zIndex to 3
    // revert the rest
    const allMarkers = markerRefs.current;

    allMarkers?.forEach((card, i) => {
      if (!card.classList.contains("mapbox-custom-image-marker")) {
        if (i === index) {
          (card as HTMLElement).style.zIndex = "3";
          (card as HTMLElement).style.backgroundColor = "rgb(207,255,80)";
        } else {
          (card as HTMLElement).style.zIndex = "1";
          (card as HTMLElement).style.backgroundColor = "rgba(18,18,18,0.5)";
        }
      }
    });
  }, []);

  const scrollToCard = useCallback(
    (pid: string) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const cards = container.children;

      const element = Array.from(cards).find(
        (card) => card.id === pid // Access data-pid
      );

      if (element) {
        // Optionally disable scroll snap temporarily
        container.style.scrollSnapType = "none";

        // Calculate the bounding rectangles for the element and the container
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate offsets to center the element
        const horizontalOffset =
          elementRect.left -
          containerRect.left +
          elementRect.width / 2 -
          containerRect.width / 2;

        const verticalOffset =
          elementRect.top -
          containerRect.top +
          elementRect.height / 2 -
          containerRect.height / 2;

        container.scrollBy({
          left: horizontalOffset,
          top: verticalOffset,
          behavior: "smooth",
        });

        // Re-enable scroll snap after scrolling
        setTimeout(() => {
          container.style.scrollSnapType = isMobile
            ? "x mandatory"
            : "y mandatory";
        }, 500); // Adjust timeout as needed
      } else {
        console.warn(`No element found with id: ${pid}`);
      }
    },
    [isMobile]
  );

  const addUserMarker = useCallback(() => {
    if (!userLocation || !mapRef?.current) return;

    const userMarkerElement = document.createElement("span");
    userMarkerElement.className =
      "relative custom-mapbox-user-marker text-xl md:text-lg bg-zui-white/50 w-6 h-6 rounded-full flex justify-center items-center";
    const userMarker = document.createElement("span");
    userMarker.className = "w-4 h-4 bg-zui-neon rounded-full";
    userMarkerElement.appendChild(userMarker);

    new mapboxgl.Marker(userMarkerElement)
      .setLngLat(userLocation)
      .addTo(mapRef?.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  const plotMarkers = useCallback(
    (events: BookingExperienceResponse[]) => {
      if (!mapRef?.current) return;

      // Remove existing markers
      const allMarkers = mapContainerRef?.current?.querySelectorAll(
        ".mapboxgl-marker:not(.custom-mapbox-user-marker)"
      );
      allMarkers?.forEach((marker) => marker.remove());
      markerRefs.current = [];

      //   plot zo house
      const zoHouseMarkerElement = document.createElement("img");
      zoHouseMarkerElement.src = `${process.env.MEDIA_BASE_URL}/gallery/media/images/70faa449-7c42-45cd-8452-cf6aa1acdb84_20241012083630.svg`;
      zoHouseMarkerElement.className =
        "mapbox-custom-image-marker w-10 h-10 z-20";

      // {{ edit_1 }}: Add this line to plot the marker on the map
      new mapboxgl.Marker(zoHouseMarkerElement)
        .setLngLat(initialCoordinates) // Set the position using the coordinates
        .addTo(mapRef.current!); // Add the marker to the map

      // Plot new markers based on filtered events
      events.forEach((event, index) => {
        if (event.category === "listing") {
          let eventMarkerElement;
          if (event.icon) {
            eventMarkerElement = document.createElement("img");
            eventMarkerElement.src = event.icon;
            eventMarkerElement.title = event.name;

            eventMarkerElement.className =
              "mapbox-custom-image-marker w-10 h-10";
          } else {
            eventMarkerElement = document.createElement("span");
            eventMarkerElement.className =
              "mapbox-custom-marker text-xl md:text-lg bg-zui-dark/50 w-10 h-10 rounded-full flex justify-center items-center";
            eventMarkerElement.textContent =
              cultureMarkers[event.subcategory!.toLowerCase()] || "📍";
          }

          markerRefs.current.push(eventMarkerElement);

          new mapboxgl.Marker(eventMarkerElement)
            .setLngLat([event.longitude, event.latitude])
            .addTo(mapRef.current!);

          eventMarkerElement.addEventListener("click", () => {
            setSelectedEvent(event);
            scrollToCard(event.pid);
          });
        } else {
          const eventMarkerElement = document.createElement("img");
          eventMarkerElement.src =
            event.icon ||
            `${process.env.MEDIA_BASE_URL}/gallery/media/images/1de63b88-e13d-48f8-8ffa-b6aa1692485d_20240914074959.svg`;

          eventMarkerElement.className = "zo-event-marker";
          eventMarkerElement.title = event.name;

          markerRefs.current.push(eventMarkerElement);

          new mapboxgl.Marker(eventMarkerElement)
            .setLngLat([event.longitude, event.latitude])
            .addTo(mapRef.current!);

          eventMarkerElement.addEventListener("click", () => {
            setSelectedEvent(event);
            scrollToCard(event.pid);
          });
        }
      });
    },
    [scrollToCard, setSelectedEvent, initialCoordinates]
  );

  const initializeMap = useCallback(() => {
    if (mapRef && userLocation && mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current as HTMLElement,
        center: initialCoordinates,
        zoom: zoom,
        pitch: 60,
        bearing: -30,
        scrollZoom: false,
        attributionControl: false,
      });

      mapRef.current.on("style.load", () => {
        if (mapRef.current) {
          mapRef
            ?.current!.setConfigProperty("basemap", "lightPreset", "night")
            .setConfigProperty("basemap", "showPointOfInterestLabels", false)
            .setConfigProperty("basemap", "showPlaceLabels", false)
            .setConfigProperty("basemap", "showRoadLabels", false)
            .setConfigProperty("basemap", "showTransitLabels", false)
            .addLayer(buildingLayer as LayerSpecification);
        }
        addUserMarker();
      });
    }

    mapRef?.current?.on("zoom", () => {
      const zoomLevel = mapRef.current?.getZoom();
      if (zoomLevel) {
        setZoom(zoomLevel);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, isMobile, addUserMarker]);

  const handleJumpToUserLocation = () => {
    if (!mapRef || typeof mapRef !== "object") return;
    if (userLocation && mapRef.current) {
      zoomToLocation(mapRef.current, userLocation, 15);
    }
  };
  const handleJumpToInitialCoordinates = () => {
    if (!mapRef || typeof mapRef !== "object") return;
    if (initialCoordinates && mapRef.current) {
      zoomToLocation(mapRef.current, initialCoordinates, 15);
    }
  };

  const handleZoZoButtonClick = () => {
    if (isAtZoHouse) {
      handleJumpToUserLocation();
      setIsAtZoHouse(false);
    } else {
      handleJumpToInitialCoordinates();
      setIsAtZoHouse(true);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    plotMarkers(filteredEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEvents]);

  useEffect(() => {
    if (!eventsData) {
      return;
    }

    const filtered = eventsData.filter((event) => {
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

    setFilteredEvents(filtered);
  }, [selectedCategory, selectedDate, eventsData, userLocation]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({
            lat: latitude,
            lng: longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Fallback to default location if permission is denied or any error occurs
          setUserLocation(initialCoordinates);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation(initialCoordinates); // Fallback location
    }
  }, [initialCoordinates]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const containerCenterX = containerRect.left + containerRect.width / 2;

        const cards = container.children;
        let closestCard = null;
        let closestDistance = Infinity;

        Array.from(cards).forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;

          const distance = Math.abs(containerCenterX - cardCenterX);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestCard = card;
          }
        });

        if (closestCard) {
          const cardIndex = Array.from(cards).indexOf(closestCard);
          const location = filteredEvents[cardIndex];
          setSelectedEvent(location);
        }
      }, 100);
    };
    if (isMobile) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEvents, isMobile]);

  useEffect(() => {
    if (selectedEvent) {
      showEventOnMap(selectedEvent);
      const index = filteredEvents.findIndex(
        (event) => event.pid === selectedEvent.pid
      );
      scaleMarker(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, showEventOnMap]);

  useEffect(() => {
    const updateTimes = () => {
      const now = moment();
      setCurrentTime(now);

      const operatorTimezone = operator?.destination?.timezone;
      if (!operatorTimezone) {
        console.error("Time Zone Not Provided.");
        return;
      }

      // Use moment-timezone to calculate operatorTime based on the operator's timezone
      const opeatorLocalTimeNow = operatorTimezone
        ? now.clone().tz(operatorTimezone)
        : now.clone(); // Fallback to current timezone if unavailable

      setOperatorTime(opeatorLocalTimeNow);

      const hour = opeatorLocalTimeNow.hour();
      setIsDay(hour >= 6 && hour < 18); // Assuming day is from 6 AM to 6 PM
    };

    updateTimes(); // Initial update

    const timer = setInterval(updateTimes, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [operator]);

  const operatorLogo = useMemo(() => {
    if (!operator?.media || operator.media.length === 0) return null;

    return operator.media.reduce(
      (max, media) => (media.sort_index > max.sort_index ? media : max),
      operator.media[0]
    ); // Set the first media item as the initial value
  }, [operator]);

  return (
    <>
      <section
        className={cn("w-full h-[85vh] relative overflow-y-hidden", className)}
      >
        <div className="absolute top-6 md:left-6 px-6 md:px-0 z-20 w-full md:w-auto">
          <div className="w-full md:w-auto flex items-center justify-between">
            <Link className="flex items-center gap-6" href="/">
              <img
                className="w-10 aspect-square object-contain"
                src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
                alt="zo-zo"
              />
              <div className={rubikClassName}>
                <h6 className={cn("hidden md:block font-semibold")}>
                  Zo World
                </h6>
                <p className="hidden md:block text-sm text-zui-white pointer-events-none">
                  From the makers of Zostel
                </p>
              </div>
            </Link>

            <button
              onClick={setIsViewAllEventsOpen.bind(null, true)}
              className="md:hidden p-3 bg-zui-dark border border-zui-stroke rounded-full"
            >
              <Icon name="Search" size={16} fill="#fff" />
            </button>
          </div>

          <div className="md:hidden flex items-center justify-center gap-4 mt-4 z-90 relative">
            <DateFilter
              options={dateOptions || []}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              optionsContainerClassName="z-100"
              className="w-32"
            />

            {categoryOptions?.length > 1 && (
              <CategoryFilter
                className="w-32"
                options={categoryOptions || []}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                optionsContainerClassName="z-100"
              />
            )}
          </div>
        </div>

        <div className="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div
            className={cn(
              "flex items-center justify-center gap-2 text-zui-neon"
            )}
          >
            <h2 className="font-medium text-2xl tracking-[1%]">
              {operator?.destination?.name}
            </h2>
            {isDay ? (
              <img
                src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/c3fa8870-5f37-4446-bb53-39ae8cd092f6_20241012083644.svg`}
                alt=" Time"
                className=""
              />
            ) : (
              <img
                src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/40c252fb-21d0-4af1-88f4-d8d03cb99064_20241015123456.svg`}
                alt="Time"
                className=""
              />
            )}
            <h5>{operatorTime.format("HH:mm")}</h5>
            <span className="text-zui-silver">
              {operatorTime.format(" [GMT]Z")}
            </span>
          </div>

          <div
            className={cn("text-center mt-2 text-sm font-medium text-white")}
          >
            <h6>Local Time {currentTime.format("HH:mm [GMT]Z")}</h6>
          </div>
        </div>

        {operator && (
          <div className="absolute top-6 py-3 md:py-0 right-1/2 translate-x-1/2 md:translate-x-0 md:right-8 z-20 flex items-center gap-4">
            {operatorLogo && (
              <img
                className="h-6 md:h-10 object-contain"
                src={operatorLogo.url}
                alt={operatorLogo.metadata.alt || "Operator Logo"}
              />
            )}
          </div>
        )}

        <div className="w-full h-full overflow-x-hidden z-0">
          <div className="map-events-container w-full h-full relative">
            <div id="map-container" className="w-full h-full">
              <div
                id="map"
                className="w-full h-full"
                ref={mapContainerRef}
              ></div>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="absolute left-4 flex flex-col gap-2 z-20 bottom-6">
            <div className="flex flex-col items-center gap-2 bg-zui-lighter border border-zui-stroke rounded-full p-2 py-3">
              <button onClick={handleZoomIn}>
                <Icon fill="#fff" name="Plus" size={24} />
              </button>
              <button onClick={handleZoomOut}>
                <Icon fill="#fff" name="Minus" size={24} />
              </button>
            </div>
          </div>
        )}

        <div className="h-24 w-full bg-gradient-to-b from-zui-dark to-transparent absolute left-0 top-0 z-10" />
        <div className="h-24 w-full bg-gradient-to-t from-zui-dark to-transparent absolute left-0 bottom-0 z-10" />

        <div className="flex flex-col items-center absolute z-10 gap-2 bottom-48 right-6 md:right-0 md:left-0 md:justify-center md:bottom-8 md:flex-row">
          <ZoZoButton
            height={isMobile ? 40 : 56}
            width={isMobile ? 40 : 56}
            onClick={handleZoZoButtonClick}
          />
        </div>

        <EventSidebar
          ref={scrollContainerRef}
          dateOptions={dateOptions}
          categoryOptions={categoryOptions || []}
          selectedCategory={selectedCategory}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setSelectedCategory={setSelectedCategory}
          events={filteredEvents}
          isLoading={isLoading}
          setSelectedEvent={setSelectedEvent}
          selectedEventId={selectedEvent?.pid}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setIsViewAllEventsOpen={setIsViewAllEventsOpen}
          eventListClassName="bottom-20 md:bottom-0 md:max-h-[80vh]"
          sidebarClassName="md:top-20"
        />
      </section>
    </>
  );
};

export default HeroSection;
