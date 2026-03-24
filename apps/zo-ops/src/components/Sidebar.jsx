import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  styled,
  ListItemButton,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
} from "@mui/material";
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  WhatsApp as WhatsAppIcon,
  Forum as SlackIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import Link from "next/link";

const drawerWidth = 240;

const Logo = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(3),
  color: "#FFFFFF",
  fontWeight: 600,
  fontSize: "1.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  color: "#FFFFFF",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
  },
  "&.Mui-selected": {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
  },
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  "& .MuiListItemText-primary": {
    color: "#FFFFFF",
    fontWeight: 500,
    fontSize: "0.95rem",
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  color: "#FFFFFF",
  minWidth: "40px",
}));

const Sidebar = ({ routes, mobileOpen, handleDrawerToggle }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem("auth_data");

    // Navigate to login page
    router.push("/Login");
  };

  const drawer = (
    <Box>
      <Logo>
        Zo Ops
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Logo>
      <List>
        {routes.map((route) => (
          <ListItem key={route.path} disablePadding>
            <Link href={route.path} passHref>
              <StyledListItemButton
                selected={router.pathname === route.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
              >
                <StyledListItemIcon>{route.icon}</StyledListItemIcon>
                <StyledListItemText primary={route.label} />
              </StyledListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
      <Button
        color="inherit"
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
        sx={{
          marginLeft: "16px",
          marginTop: "32px",
          color: "#FFFFFF",
          fontWeight: 500,
          fontSize: "0.95rem",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "#FFFFFF",
          },
        }}
      >
        Logout
      </Button>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            bgcolor: "background.default",
            borderRight: "1px solid",
            borderColor: "divider",
            boxShadow: "1px 0 8px rgb(0 0 0 / 0.1)",
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            bgcolor: "background.default",
            borderRight: "1px solid",
            borderColor: "divider",
            boxShadow: "1px 0 8px rgb(0 0 0 / 0.1)",
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
