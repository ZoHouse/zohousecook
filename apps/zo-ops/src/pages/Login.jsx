import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useRouter } from "next/router";
import { environment } from "../environments/environment";

const Login = () => {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic phone validation
    if (!phone.trim() || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${environment.apiUrl}/api/auth/generate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile_country_code: "91",
            mobile_number: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setSnackbar({
        open: true,
        message: "OTP sent successfully!",
        severity: "success",
      });
      setStep("otp");
    } catch (error) {
      setError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp.trim() || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${environment.apiUrl}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile_country_code: "91",
            mobile_number: phone,
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      if (!data.isAdmin) {
        throw new Error("You do not have permission to access this dashboard");
      }

      // Store the complete login response
      localStorage.setItem(
        "auth_data",
        JSON.stringify({
          ...data,
          loginTimestamp: new Date().getTime(),
        })
      );

      // Navigate to dashboard
      router.push("/reviews");
    } catch (error) {
      setError(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        `${environment.apiUrl}/api/auth/generate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile_country_code: "91",
            mobile_number: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setSnackbar({
        open: true,
        message: "OTP resent successfully!",
        severity: "success",
      });
    } catch (error) {
      setError(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 2,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h5" align="center" gutterBottom>
            {step === "phone" ? "Login" : "Enter OTP"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setPhone(value);
                    }
                  }}
                  required
                  fullWidth
                  placeholder="Enter your phone number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">+91</InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: "primary.main",
                    color: "rgb(20, 20, 20)",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="OTP"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  required
                  fullWidth
                  placeholder="Enter 6-digit OTP"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: "primary.main",
                    color: "rgb(20, 20, 20)",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <Button
                  variant="text"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                >
                  Change Phone Number
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
