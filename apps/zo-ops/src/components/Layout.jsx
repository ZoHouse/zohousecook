import React, { useState } from "react";
import { Box, AppBar, Toolbar, IconButton, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon, People as PeopleIcon, WhatsApp as WhatsAppIcon, Forum as SlackIcon, Settings as SettingsIcon } from "@mui/icons-material";
import Sidebar from "./Sidebar";

const routes = [
  { path: "/reviews", label: "Reviews", icon: <PeopleIcon /> },
  { path: "/whatsapp-notices", label: "WhatsApp Notices", icon: <WhatsAppIcon /> },
  { path: "/slack-messaging", label: "Slack Messaging", icon: <SlackIcon /> },
  { path: "/app-notifications", label: "App Notifications", icon: <SettingsIcon /> },
];

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar routes={routes} mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: "240px" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;