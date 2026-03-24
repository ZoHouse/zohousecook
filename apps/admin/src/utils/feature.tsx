import * as MuiIcons from "@mui/icons-material";
import { SvgIconProps } from "@mui/material";

/**
 * Convert Material icon name like "local_laundry_service"
 * → "LocalLaundryService"
 */
export const formatIconName = (value?: string): string => {
  if (!value) return "HelpOutline";

  const cleaned = value.replace(/[^\w_]/g, "");
  if (!cleaned) return "HelpOutline";

  return cleaned
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
};

/**
 * Render a Material UI icon component by name.
 * Falls back to HelpOutline if icon not found.
 */
export const renderMaterialIcon = (iconName?: string) => {
  const formattedName = formatIconName(iconName);

  const IconComponent = (
    MuiIcons as Record<string, React.ComponentType<SvgIconProps>>
  )[formattedName];

  const IconToRender = IconComponent || MuiIcons.HelpOutline;

  return <IconToRender style={{ fontSize: 20, color: "#5a5a5a" }} />;
};
