import Axios from "axios";

const zostelServer = Axios.create({
  baseURL: process.env.API_BASE_URL_ZOSTEL || "",
});

const zoServer = Axios.create({
  baseURL: process.env.API_BASE_URL || "",
});

// Dedicated client for Passport Game of Life v2 endpoints (quests, leaderboards v2,
// earnings, subscription, referral, season, share, profile-with-passport_roles).
// Routes to API_BASE_URL_PASSPORT so these endpoints can point at the Postman mock
// or Daya's staging backend while everything else stays on prod. Falls back to
// API_BASE_URL if the passport var is unset.
const zoPassportServer = Axios.create({
  baseURL: process.env.API_BASE_URL_PASSPORT || process.env.API_BASE_URL || "",
});

const setZostelServerHeaders = (headers: any) => {
  zostelServer.defaults.headers = {
    ...zostelServer.defaults.headers,
    ...headers,
  };
};

const getZostelServerHeaders = () => {
  return zostelServer.defaults.headers;
};

const setZostelInterceptors = (...interceptors: any[]) => {
  zostelServer.interceptors.response.use(...interceptors);
};

const setZoServerHeaders = (headers: any) => {
  zoServer.defaults.headers = {
    ...zoServer.defaults.headers,
    ...headers,
  };
};

const getZoServerHeaders = () => {
  return zoServer.defaults.headers;
};

zoServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

zostelServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

zoPassportServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

const setZoPassportServerHeaders = (headers: any) => {
  zoPassportServer.defaults.headers = {
    ...zoPassportServer.defaults.headers,
    ...headers,
  };
};

const getZoPassportServerHeaders = () => {
  return zoPassportServer.defaults.headers;
};

export {
  getZoPassportServerHeaders,
  getZoServerHeaders,
  getZostelServerHeaders,
  setZoPassportServerHeaders,
  setZoServerHeaders,
  setZostelInterceptors,
  setZostelServerHeaders,
  zoPassportServer,
  zoServer,
  zostelServer,
};
