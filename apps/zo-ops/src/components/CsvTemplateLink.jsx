import React from "react";
import { Box, Link, Typography } from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";

const CsvTemplateLink = () => {
  // This would be your actual Google Sheets template URL
  const templateUrl =
    "https://docs.google.com/spreadsheets/d/1LO0rIIIONBtgPmnc7VNOZatS8x77TVfuxQhqPM-g-ao/edit?usp=sharing";

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Need help with the CSV format? Open the below Google Sheet, make a copy
        of it, add columns for every variable you want to use, and fill in the
        values for every applicable property. You can then download it as CSV
        and upload it here.
      </Typography>
      <Link
        href={templateUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "primary.main",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        }}
      >
        <GoogleIcon fontSize="small" />
        Use our Google Sheets template
      </Link>
    </Box>
  );
};

export default CsvTemplateLink;
