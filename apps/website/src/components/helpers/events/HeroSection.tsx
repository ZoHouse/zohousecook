import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import mapboxgl, { LayerSpecification } from "mapbox-gl";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BookingExperienceResponse } from "../../../config";
import cultureMarkers from "../../../config/token2049";
import DateFilter from "../singapore-event-map/DateFilter";
import EventsList from "../singapore-event-map/EventsList";
import { buildingLayer } from "../singapore-event-map/MapConfig";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface Coordinates {
  lng: number;
  lat: number;
}

function generateBoundingBoxQuery(sw: Coordinates, ne: Coordinates): string {
  const queryParams = new URLSearchParams({
    longitude__gte: sw.lng.toString(),
    latitude__gte: sw.lat.toString(),
    longitude__lte: ne.lng.toString(),
    latitude__lte: ne.lat.toString(),
  });

  return queryParams.toString() + "/";
}

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

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const router = useRouter();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<HTMLElement[]>([]);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  const [selectedDate, setSelectedDate] = useState("all");
  const [mapCenter, setMapCenter] = useState<{
    lng: number;
    lat: number;
  } | null>(
    router.query.lat && router.query.long
      ? {
          lng: +router.query.long,
          lat: +router.query.lat,
        }
      : null
  );
  const [zoom, setZoom] = useState<number>(
    router.query.zoom ? +router.query.zoom : 15.5
  );
  const [bounds, setBounds] = useState<mapboxgl.LngLatBounds | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const { isMobile } = useWindowSize();

  const [filteredEvents, setFilteredEvents] = useState<
    BookingExperienceResponse[]
  >([]);

  const [selectedEvent, setSelectedEvent] =
    useState<BookingExperienceResponse | null>(null);

  const { isLoading, data: eventsData } = useQueryApi<
    BookingExperienceResponse[]
  >(
    "BOOKINGS_EXPERIENCE_INVENTORY",
    {
      select: (data) => {
        const allEvents: BookingExperienceResponse[] = data.data.results;
        const allEventsWithDistance = allEvents
          .filter(
            (e) =>
              !isNaN(e.latitude) && !isNaN(e.longitude) && e.status === "active"
          )
          .map((event: BookingExperienceResponse) => {
            const distance = getDistance(
              userLocation![1],
              userLocation![0],
              +event.latitude,
              +event.longitude
            );
            return { ...event, distance };
          });
        const sortedEvents = allEventsWithDistance.sort(
          (a, b) => +a.distance - +b.distance
        );

        return sortedEvents;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled:
        isValidString(process.env.SINGAPORE_OPERATOR_PID) &&
        isValidObject(bounds),
    },
    "/all",
    bounds
      ? generateBoundingBoxQuery(bounds!.getSouthWest(), bounds!.getNorthEast())
      : ""
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
        label: "All",
        value: "all",
      });

      console.log("Date options:", dates);

      return dates;
    } else {
      return [];
    }
  }, [eventsData]);

  function zoomToLocation(
    map: mapboxgl.Map,
    coordinates: [number, number],
    zoomLevel: number = 15.5,
    pitch: number = 30,
    bearing: number = -30,
    duration: number = 1000
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

  const showEventOnMap = useCallback((event: BookingExperienceResponse) => {
    if (mapRef.current) {
      zoomToLocation(mapRef.current, [+event.longitude, +event.latitude], 16);
    }
  }, []);

  const scaleMarker = useCallback((index: number) => {
    // scale the index one to 1.5 and add zIndex to 3
    // revert the rest
    const allMarkers = markerRefs.current;

    console.log("scaleMarker:", index, allMarkers);

    allMarkers?.forEach((card, i) => {
      if (!card.classList.contains("mapbox-custom-image-marker")) {
        if (i === index) {
          console.log("Selected card index:", i, card);
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
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const cards = container.children;

      if (cards[index]) {
        // Optionally disable scroll snap temporarily
        container.style.scrollSnapType = "none";

        cards[index].scrollIntoView({
          behavior: "smooth",
          block: "nearest", // Prevents vertical scrolling
          inline: "center", // Scrolls the card to the center horizontally
        });

        // Re-enable scroll snap after scrolling
        setTimeout(() => {
          if (isMobile) {
            container.style.scrollSnapType = "x mandatory";
          } else {
            container.style.scrollSnapType = "y mandatory";
          }
        }, 500); // Adjust timeout as needed
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scaleMarker]
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

      console.log("Plotting markers...", events.length);

      // Remove existing markers
      const allMarkers = mapContainerRef?.current?.querySelectorAll(
        ".mapboxgl-marker:not(.custom-mapbox-user-marker)"
      );
      allMarkers?.forEach((marker) => marker.remove());
      markerRefs.current = [];

      // Plot new markers based on filtered events
      events.forEach((event, index) => {
        if (event.category === "listing") {
          let eventMarkerElement;
          if (event.icon) {
            eventMarkerElement = document.createElement("img");
            eventMarkerElement.src = event.icon;

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
            scrollToCard(index);
          });
        } else {
          const eventMarkerElement = document.createElement("img");
          eventMarkerElement.src =
            event.icon ||
            `${process.env.MEDIA_BASE_URL}/gallery/media/images/1de63b88-e13d-48f8-8ffa-b6aa1692485d_20240914074959.svg`;

          eventMarkerElement.className = "zo-event-marker";

          markerRefs.current.push(eventMarkerElement);

          new mapboxgl.Marker(eventMarkerElement)
            .setLngLat([event.longitude, event.latitude])
            .addTo(mapRef.current!);

          eventMarkerElement.addEventListener("click", () => {
            setSelectedEvent(event);
            scrollToCard(index);
          });
        }
      });
      console.log("Markers plotted successfully!", markerRefs.current);
    },
    [scrollToCard]
  );

  const initializeMap = useCallback(() => {
    if (mapRef && userLocation && mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current as HTMLElement,
        center: mapCenter || userLocation,
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
          if (!isMobile) {
            mapRef.current?.addControl(
              new mapboxgl.NavigationControl(),
              "bottom-left"
            );
          }

          //   i want the current top left and bottom right coordinates of the map currently in view

          const bounds = mapRef.current?.getBounds();
          if (bounds) {
            setBounds(bounds);
          }
        }
        addUserMarker();
      });
    }

    mapRef?.current?.on("move", () => {
      const center = mapRef.current?.getCenter();
      if (center) {
        setMapCenter({ lng: center.lng, lat: center.lat });
      }
    });

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

      const isDateMatch =
        selectedDate !== "all"
          ? moment(selectedDate).isBetween(
              eventStartDate,
              eventEndDate,
              "date",
              "[]"
            )
          : true;

      return isDateMatch;
    });

    setFilteredEvents(filtered);
  }, [selectedDate, eventsData, userLocation]);

  // Get user's location
  useEffect(() => {
    const _location: [number, number] = [103.854, 1.29];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Fallback to default location if permission is denied or any error occurs
          setUserLocation(_location);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation(_location); // Fallback location
    }
  }, []);

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
          console.log("Selected card index:", cardIndex);
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
      console.log("Selected event:", selectedEvent);
      showEventOnMap(selectedEvent);
      const index = filteredEvents.findIndex(
        (event) => event.pid === selectedEvent.pid
      );
      scaleMarker(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, showEventOnMap]);

  return (
    <>
      <section className="w-full h-[92vh] relative">
        <header className="top-12 absolute left-0 w-full z-10">
          <div className="flex items-center justify-center gap-3">
            <Link href={"/"}>
              <img
                className="h-8"
                src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/46c3ebc6-64f5-49a4-bddb-90bce7b1e723_20240911094544.svg`}
                alt="Zo World"
              />
            </Link>
          </div>

          <p className="text-sm font-medium text-center mt-2 mb-4">
            A brave new world.
          </p>

          <div className="flex items-center justify-center gap-4">
            <DateFilter
              options={dateOptions || []}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </header>

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

        <div className="h-24 w-full bg-gradient-to-b from-zui-dark to-transparent absolute left-0 top-0 z-10" />
        <div className="h-24 w-full bg-gradient-to-t from-zui-dark to-transparent absolute left-0 -bottom-1 z-10" />

        <div className="flex flex-col items-center absolute z-10 gap-2 bottom-72 right-2 md:right-0 md:left-0 md:justify-center md:bottom-8 md:flex-row">
          <button
            onClick={handleJumpToUserLocation}
            className="bg-zui-dark border border-zui-white/10 rounded-full p-4"
          >
            <Icon name="LocateMe" size={24} fill="#fff" />
          </button>
        </div>

        <EventsList
          ref={scrollContainerRef}
          events={filteredEvents}
          isLoading={isLoading}
          setSelectedEvent={setSelectedEvent}
          selectedEventId={selectedEvent?.pid}
        />
      </section>
    </>
  );
};

export default HeroSection;
