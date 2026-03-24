import TagIcon from "@mui/icons-material/Category";
import ListIcon from "@mui/icons-material/List";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

export const TOOLS: ToolConfig[] = [
  {
    id: "featured-tags",
    name: "Featured Tags Management",
    description: "Manage featured tags for trips",
    icon: TagIcon,
  },
  {
    id: "spotlights",
    name: "Spotlight Card Management",
    description: "Manage spotlighted trips",
    icon: StarIcon,
  },
  {
    id: "headers",
    name: "Header Sorting Management",
    description: "Manage trips in header",
    icon: ViewCarouselIcon,
  },
];

export const TRIP_VENDOR_OPTIONS: ToolConfig[] = [
  {
    id: "vendor-list",
    name: "Trip Vendors",
    description: "View and manage trip vendors",
    icon: ListIcon,
  },
  {
    id: "vendor-service",
    name: "Vendor Services",
    description: "View and manage vendor services",
    icon: TagIcon,
  },
  {
    id: "vendor-destinations",
    name: "Vendor Destinations",
    description: "View and manage vendor destinations",
    icon: LocationOnIcon,
  },
];
