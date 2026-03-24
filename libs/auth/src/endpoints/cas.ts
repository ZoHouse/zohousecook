import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const casQueryApis = {
  CAS_ADDONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "addons", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/addons/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,

  CAS_ADDONS_PRICES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "addons", "prices", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/addon-prices/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_DESTINATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "destinations", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/destinations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_LOCATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "locations", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/locations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ESSENTIALS_INVENTORY_ITINERARIES: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "essentials",
        "inventory-itineraries",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/essentials/inventory-itineraries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_ESSENTIALS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "essentials", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/essentials/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_INVENTORY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "inventory", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/inventory/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_COUNTRIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "countries", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/countries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_CURRENCY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "currency", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/currency/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_CULTURES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "cultures", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/cultures/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LOCKS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "locks", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/locks/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ENTRY_POINTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "entry-points", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/entry-points/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_MEDIA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "media", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/media/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_OPERATORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "operators", additionalRoute, search],
      additionalRoute,
      search,
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/operators/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_DATA_FIELDS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "datafields", additionalRoute, search],
      additionalRoute,
      search,
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/datafields/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_BULLETIN_BOARDS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "bulletin-boards", additionalRoute, search],
      additionalRoute,
      search,
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/bulletin-boards/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_BULLETINS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "bulletins", additionalRoute, search],
      additionalRoute,
      search,
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/bulletins/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_OPERATOR_VENDORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "operator-vendors", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/operator-vendors/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_VENDOR_SERVICE_DESTINATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "vendor-service-destinations", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/vendor-service-destinations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SKU: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "sku", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/sku/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TRIP_DISCOVER_PRICING: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "trip", "discover", "pricing", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/trip/discover/pricing/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TRIP_DISCOVER_ADDON_PRICING: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "trip",
        "discover",
        "addon-pricing",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/trip/discover/addon-pricing/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TRIP_DISCOVER_AVAILABILITY: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "trip",
        "discover",
        "availability",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/trip/discover/availability/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FEATURES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "features", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/features/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SEED: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "seed", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/seed/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PROFILES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "profiles", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/profiles/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PARTNERSHIP_APPLICATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "partnership", "applications", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/partnership/applications/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_DEALS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "deals", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/deals/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_STAY_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "stay", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/stay/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TRIP_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "trip", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/trip/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EXPERIENCE_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "experience", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/experience/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_OFFERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "offers", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/offers/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ACCESSGROUP: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "access-groups", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/access-groups/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_USERACCESSGROUPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "user-access-groups", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/user-access-groups/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_CUSTOMERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "customers", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/customers/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_CALENDAREVENTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "calendar-events", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/calendar-events/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_WEIGHTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "weights", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/weights/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_ARTISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "artists", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/artists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_USERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "users", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/users/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_PROFILE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "profile", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/profile/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_PROMOTIONAL: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "promotional", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/promotional/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_DISPLAY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "showcase", "displays", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/displays/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SHOWCASE_DISPLAY_SESSION: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "showcase",
        "displays",
        "sessions",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/showcase/displays/sessions/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LOCATIONS_PROPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "locations", "props", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/locations/props/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LOCATIONS_PROPS_AREAS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "locations", "props", "areas", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/locations/props/areas/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_CREDITS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "credits", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/credits/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LOCATIONS_PROPS_FLOORS: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "locations",
        "props",
        "floors",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/locations/props/floors/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_STAY_DISCOVER_PRICING: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "stay", "discover", "pricing", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/stay/discover/pricing/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_STAY_DISCOVER_AVAILABILITY: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "stay",
        "discover",
        "availability",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/stay/discover/availability/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FOUNDER_ALLOWLISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "founder", "allowlists", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/founder/allowlists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_STUDIO_ARTISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "studio", "artists", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/studio/artists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_STUDIO_ARTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "studio", "arts", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/studio/arts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EVENT: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "event", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/event/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EVENTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "events", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/events/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_VISITS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "visits", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/visits/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FOUNDER_TOKENS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "founder-tokens", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/founder-tokens/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FOUNDER_TOKENS_STATS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "founder-tokens", "stats", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/founder-tokens/stats/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FOUNDER_TOKENS_OWNERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "founder-tokens", "owners", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/founder-tokens/owners/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ESTATES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "estates", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/estates/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SPACES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "spaces", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/spaces/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ELIGIBILITY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "eligibility", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/eligibility/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SPOTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "spots", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/spots/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FLOORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "floors", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/floors/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_INVITES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "invites", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/invites/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,

  CAS_FOUNDER_DETAILS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "founder", "details", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/invites/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_VISITS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "visits", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/visits/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_INVENTORIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "inventories", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/inventories/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_DESTINATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "destinations", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/destinations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_OPERATORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "operators", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/operators/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_POA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "poa", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/poa/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_MESSAGE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "messages", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/messages/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_ALLOWLISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "allowlists", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/allowlists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_BULLETINS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "bulletins", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/bulletins/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REPORTS_SHOWCASES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "showcases", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/showcases/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_REPORTS_RATINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "ratings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/ratings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_REPORT_USERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reports", "users", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/reports/users/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_COMMS_THREADS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "comms", "threads", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/comms/threads/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_HOUSEKEEPING_TEMPLATES: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "housekeeping",
        "templates",
        "tasks",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/housekeeping/tasks/templates/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_UTILITY_DISCOVER_PRICING: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "utility",
        "discover",
        "pricing",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/utility/discover/pricing/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_UTILITY_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "utility",
        "discover",
        "pricing",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/utility/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_UTILITY_DISCOVER_AVAILABILITY: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "utility",
        "discover",
        "availability",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/utility/discover/availability/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_HOUSEKEEPING_SCHEDULES: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "housekeeping",
        "schedules",
        "tasks",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/housekeeping/tasks/schedules/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_HOUSEKEEPING_TASKS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "housekeeping", "tasks", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/housekeeping/tasks/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_HOUSEKEEPING_TASKS_FROM_TEMPLATE: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "cas",
        "housekeeping",
        "from-template",
        "tasks",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/housekeeping/tasks/from-template/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_HOUSEKEEPING_ATTENDANCE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "housekeeping", "attendance", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/housekeeping/attendance/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EVM_CONTRACTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "evm-contracts", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/evm-contracts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_USERDEVICES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "user-devices", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/user-devices/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LEDGER: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "ledger", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/ledger/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_POAS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "poa", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/poa/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,

  CAS_CANCELLATION_POLICY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "cancellation-policy", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/cancellation-policy/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_INVENTORY_RATE_PLANS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "inventory-rate-plans", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/inventory-rate-plans/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_QUESTIONNAIRES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "questionnaires", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/questionnaires/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_COMMS_APPLICATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "comms", "applications", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/comms/applications/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_COMMS_ACCOUNTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "comms", "accounts", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/comms/accounts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  CAS_LEADS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "comms", "accounts", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/leads/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_APPLICATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "applications", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/applications/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REVIEWS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "reviews", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/reviews/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_REVIEW_CATEGORIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "review-categories", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/review-categories/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_HOME_PAGE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "home-page", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/home-page/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PLAYTRACKS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "playtracks", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/playtracks/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PLAYLISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "playlists", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/playlists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_DISCOVER_SEARCH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "discover", "search", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/discover/search/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_NFTAIRDROPCOLLECTIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "nft-airdrop-collections", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/nft-airdrop-collections/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_USERWALLETS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "user-wallets", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/user-wallets/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_NFTAIRDROPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "nft-airdrops", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/nft-airdrops/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_COUPONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "coupons", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/coupons/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TEMPLATES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "templates", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/templates/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_METADATA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "metadata", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/metadata/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_NODES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "nodes", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/nodes/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EVENT_SCRAPERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "event-scrapers", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/event-scrapers/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TOKEN_GRANTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "token-grants", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/token-grants/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TOKEN_AIRDROPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "token-airdrops", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/token-airdrops/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_TAGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "tags", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/tags/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_FEATURED_TAGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "featured-tags", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/featured-tags/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_COSTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "costs", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/costs/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_COST_HEADS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "cost-heads", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/cost-heads/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_LOCKING: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "locking", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/locking/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PRICING: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "pricing", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/pricing/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_DISCOVER_CARD: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "discover-card", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/discover-card/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_USERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "users", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/users/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_INFO: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "info", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/info/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_INVENTORY_SCHEDULES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "inventory-schedules", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/inventory-schedules/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PM_INVENTORY_ITINERARIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "pm", "inventory-itineraries", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/pm/inventory-itineraries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_INVENTORY_ITINERARIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "inventory-itineraries", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/inventory-itineraries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_ITINERARY_STOPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "itinerary-stops", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/itinerary-stops/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_EXCLUSIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "exclusions", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/exclusions/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PM_INVENTORY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "pm", "inventory", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/pm/inventory/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_PM_MEDIA_INVENTORY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "pm", "media", "inventory", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/pm/media/inventory/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_CHANNELS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "channels", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/channels/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  CAS_SELECTIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "selections", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/selections/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_VENDOR_SERVICES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "vendor-services", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cas/vendor-services/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CAS_VENDORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cas", "vendors", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/cas/vendors/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
};

export const casMutationApis = {
  CAS_DESTINATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/destinations/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_ESSENTIALS_INVENTORY_ITINERARIES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/essentials/inventory-itineraries${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),

  CAS_INVENTORY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/inventory/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_COUNTRIES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/countries/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_LOCKS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/locks/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ENTRY_POINTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/entry-points/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_CURRENCY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/currency/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_CULTURES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/cultures/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_MEDIA: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/media/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_OPERATORS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/operators/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_OPERATOR_VENDORS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/operator-vendors/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_VENDOR_SERVICES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/vendor-services/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_VENDOR_SERVICE_DESTINATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/vendor-service-destinations/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),

  CAS_VENDORS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/vendors/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_SKU: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/sku/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_FEATURES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/features/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_BULLETIN_BOARDS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/bulletin-boards/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_BULLETINS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/bulletins/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PROFILES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/profiles/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PARTNERSHIP_APPLICATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/partnership/applications/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_STAY_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/stay/bookings/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_TRIP_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/trip/bookings/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_EXPERIENCE_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/experience/bookings/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_DEALS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/deals/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_OFFERS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/offers/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ACCESSGROUPS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/access-groups/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_USERACCESSGROUPS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/user-access-groups/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_CUSTOMERS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/customers/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_CALENDAREVENTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/calendar-events/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_WEIGHTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/weights/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_ARTISTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/artists/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_USERS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/users/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_PROFILE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/profile/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_PROMOTIONAL: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/promotional/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_CUSTOMERS_KYC: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/customers/${data.route || additionalRoute}/kyc/`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_DISPLAYS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/displays/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SHOWCASE_DISPLAYS_SESSIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/showcase/displays/sessions/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_FOUNDER_ALLOWLISTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/founder/allowlists/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_STUDIO_ARTISTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/studio/artists/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_STUDIO_ARTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/studio/arts/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_EVENT: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/event/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_EVENTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/events/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_VISITS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/visits/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ELIGIBILITY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/eligibility/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ALLOWLISTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/lists/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PLAYLISTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/playlists/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PLAYTRACKS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/playtracks/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PLAYTRACKS_BULK_CREATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/playtracks/bulk-create/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_PLAYTRACKS_BULK_UPDATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/playtracks/bulk-update/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_PLAYTRACKS_BULK_DELETE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/playtracks/bulk-delete/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_HOME_PAGE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/home-page/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SPOTS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/spots/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ESTATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/estates/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_FLOORS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/floors/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_SPACES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/spaces/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_DATA_FIELDS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/datafields/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_INVITES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/invites/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_COMMS_THREADS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/comms/threads/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_HOUSEKEEPING_TEMPLATES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/housekeeping/tasks/templates/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_HOUSEKEEPING_SCHEDULES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/housekeeping/tasks/schedules/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_HOUSEKEEPING_TASKS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/housekeeping/tasks/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_HOUSEKEEPING_TASKS_FROM_TEMPLATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/housekeeping/tasks/from-template/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_HOUSEKEEPING_ATTENDANCE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/housekeeping/attendance/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_POAS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/poa/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_CANCELLATION_POLICY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/cancellation-policy/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_QUESTIONNAIRES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/questionnaires/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_LEADS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/leads/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_REVIEW_CATEGORIES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/review-categories/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_USERS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/users/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_NFTAIRDROPS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/nft-airdrops/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_COUPONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/coupons/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_TEMPLATES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/templates/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_LOCATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/locations/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_METADATA: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/metadata/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_UTILITY_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/utility/bookings/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_NODES: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/nodes/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_EVENT_SCRAPERS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/event-scrapers/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_TOKEN_GRANTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/token-grants/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_TOKEN_AIRDROPS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/token-airdrops/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_TAGS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/tags/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_FEATURED_TAGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/featured-tags/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_LOCKING: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/locking/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PRICING: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/pricing/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_ADDONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/addons/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_ADDONS_PRICES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/addon-prices/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  CAS_COSTS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/costs/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_COST_HEADS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/cost-heads/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_DISCOVER_CARD: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/discover-card/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_MEDIA_DUPLICATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/media-duplicate/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_INVENTORY_ITINERARIES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/inventory-itineraries/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  CAS_ITINERARY_STOPS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/itinerary-stops/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_EXCLUSIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/exclusions/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PM_INVENTORY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/pm/inventory/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PM_SKU: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/pm/sku/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  CAS_PM_MEDIA_INVENTORY: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/pm/media/inventory/${
            data.route || additionalRoute
          }`,
          data: data.data,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }),
      config
    ),
  CAS_PM_INVENTORY_SCHEDULES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/pm/inventory-schedules/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),

  CAS_INVENTORY_RATE_PLANS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/inventory-rate-plans/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),

  CAS_REWARDS_VIBE_CURATORS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cas/rewards/vibe-curators/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
};

export type CAS_QUERY_ENDPOINTS = keyof typeof casQueryApis;
export type CAS_MUTATION_ENDPOINTS = keyof typeof casMutationApis;
