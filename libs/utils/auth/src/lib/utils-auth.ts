import { AuthUser } from "@zo/definitions/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { AxiosError } from "axios";
import { createHash } from "crypto";
import { toast } from "sonner";

const createNewSession: () => string = () => {
  const sessionId = createHash("sha1")
    .update(
      JSON.stringify({
        timestamp: Date.now(),
        rand: Math.random() * 10000,
      })
    )
    .digest("hex")
    .substring(0, 10);
  return sessionId;
};

const getDeviceId = () => {
  const navigator_info = window.navigator;
  const screen_info = window.screen;
  const randomString = Math.random().toString(36).substring(2);
  let uid = navigator_info.mimeTypes.length?.toString();
  uid += navigator_info.userAgent.replace(/\D+/g, "");
  uid += screen_info.height || "";
  uid += screen_info.width || "";
  uid += screen_info.pixelDepth || "";
  uid += navigator.platform.replace(/\D+/g, "") || "";
  uid += navigator.getGamepads()?.length || "";
  uid += navigator_info.languages.length || "";
  uid += navigator_info.hardwareConcurrency || "";
  uid += navigator_info.maxTouchPoints || "";
  return uid + randomString;
};

const getUserIfExists = (user: string | null) => {
  try {
    if (user != null && isValidString(user)) {
      const parsedUser: AuthUser = JSON.parse(user);
      if (isValidObject(parsedUser)) {
        return parsedUser;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logAxiosError = (error: any) => {
  if (error?.response) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      `[ERROR - ${error.response.status}] ${error.request.responseURL}\n`,
      JSON.stringify(
        {
          response: error.response.status < 500 ? error.response.data : null,
          request: {
            headers: error.config.headers,
            body:
              typeof error.config.data === "object"
                ? JSON.parse(error.config.data)
                : error.config.data,
          },
        },
        null,
        2
      )
    );
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processResponseError = (error: any): string | string[] => {
  if (error && isValidObject(error?.response?.data)) {
    const errorData = error.response.data;
    const errorMessages: string[] = [];

    Object.entries(errorData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((msg) => {
          if (isValidString(msg)) {
            errorMessages.push(`${formatCapitalize(key)}: ${msg}`);
          }
        });
      } else if (isValidString(value)) {
        errorMessages.push(`${formatCapitalize(key)}: ${value}`);
      }
    });

    if (errorMessages.length > 0) {
      return errorMessages;
    } else {
      return "An Error Occured.";
    }
  } else {
    return "An Error Occured.";
  }
};

const handleRequestOtpError = (error: AxiosError) => {
  if (error.response?.status === 429) {
    const message = (error.response?.data as { message?: string })?.message;
    if (message) {
      toast.error(message);
    }
  }
};

export {
  createNewSession,
  getDeviceId,
  getUserIfExists,
  handleRequestOtpError,
  logAxiosError,
  processResponseError,
};
