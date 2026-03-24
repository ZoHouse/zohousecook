import { createTheme } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "rgb(207, 255, 80)", // Neon green
      light: "rgb(220, 255, 120)",
      dark: "rgb(180, 220, 70)",
    },
    secondary: {
      main: "#EC4899", // Modern pink
      light: "#F472B6",
      dark: "#DB2777",
    },
    background: {
      default: "rgb(20, 20, 20)", // Dark background
      paper: "rgb(29, 29, 29)", // Secondary background
    },
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  typography: {
    fontFamily: "'Space Grotesk', sans-serif",
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.5px",
      color: "#FFFFFF", // White title text
    },
    h6: {
      fontWeight: 500,
      letterSpacing: "-0.3px",
      color: "#FFFFFF", // White title text
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 16,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          cursor: "pointer",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontSize: "0.95rem",
          fontWeight: 500,
          boxShadow: "none",
          cursor: "pointer",
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          backgroundColor: "rgb(207, 255, 80)", // Primary color
          color: "rgb(20, 20, 20)", // Black text
          "&:hover": {
            backgroundColor: "rgb(180, 220, 70)", // Darker primary on hover
          },
        },
        outlined: {
          borderColor: "rgb(207, 255, 80)",
          color: "rgb(207, 255, 80)",
          "&:hover": {
            borderColor: "rgb(180, 220, 70)",
            color: "rgb(180, 220, 70)",
          },
        },
      },
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          cursor: "pointer",
          "&.Mui-disabled": {
            cursor: "not-allowed",
          },
          "&.MuiButton-contained": {
            backgroundColor: "rgb(207, 255, 80)", // Primary color
            color: "rgb(20, 20, 20)", // Black text
            "&:hover": {
              backgroundColor: "rgb(180, 220, 70)", // Darker primary on hover
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          "&.MuiChip-deletable": {
            cursor: "pointer",
          },
        },
        deleteIcon: {
          cursor: "pointer",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: "100% !important",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          cursor: "pointer",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          cursor: "pointer",
          "&:hover": {
            cursor: "pointer",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "rgb(207, 255, 80)",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "rgb(207, 255, 80)",
          "&:hover": {
            color: "rgb(180, 220, 70)",
          },
        },
      },
    },
  },
});

export default darkTheme;
