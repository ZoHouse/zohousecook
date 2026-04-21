import Axios from "axios";

const PASSPORT_BASE_URL =
  process.env.API_BASE_URL_PASSPORT ||
  process.env.API_BASE_URL ||
  "https://api.io.zo.xyz";

export const zoPassportServer = Axios.create({ baseURL: PASSPORT_BASE_URL });

zoPassportServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("zo-admin-token") ||
        localStorage.getItem("zo-web-token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const deviceId =
        localStorage.getItem("zo-admin-device-id") ||
        localStorage.getItem("zo-web-device-id");
      const deviceSecret =
        localStorage.getItem("zo-admin-device-secret") ||
        localStorage.getItem("zo-web-device-secret");
      if (deviceId && !config.headers["client-device-id"]) {
        config.headers["client-device-id"] = deviceId;
      }
      if (deviceSecret && !config.headers["client-device-secret"]) {
        config.headers["client-device-secret"] = deviceSecret;
      }
    }
  }
  return config;
});

export const PASSPORT_API_BASE_URL = PASSPORT_BASE_URL;
