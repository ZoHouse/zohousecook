import { GeneralObject } from "@zo/definitions/general";

const copyTextToClipboard = (textToCopy: string) => {
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      console.log("Copied to clipboard!");
    })
    .catch((error) => {
      console.error("Unable to copy:", error);
    });
};

const formatCapitalize = (inputString: string) => isValidString(inputString) ?
  inputString.charAt(0).toUpperCase() +
  inputString.slice(1).replace(/[_-]/g, " ") : "";

const isValidString = (data: unknown) =>
  data != null && typeof data === "string" && data.trim() !== "";

const shortenString = (inputString: string, length: number) => {
  // shorten string from between with ... and prefix and suffix of length
  if (!isValidString(inputString)) {
    return null;
  }
  if (inputString.length > length) {
    return `${inputString.substring(0, length / 2)}...${inputString.substring(
      inputString.length - length / 2
    )}`;
  }
  return inputString;
};

const simpleSingularize = (word: string) => {
  const lowerWord = word.toLowerCase();

  if (lowerWord.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }
  if (lowerWord.endsWith("ves")) {
    return word.slice(0, -3) + "f";
  }
  if (lowerWord.endsWith("ses")) {
    return word.slice(0, -2);
  }
  if (lowerWord.endsWith("xes")) {
    return word.slice(0, -2);
  }
  if (lowerWord.endsWith("ches") || lowerWord.endsWith("shes")) {
    return word.slice(0, -2);
  }
  if (lowerWord.endsWith("s") && !lowerWord.endsWith("ss")) {
    return word.slice(0, -1);
  }

  return word;
};

const slugify = (input: string): string => {
  const slug = input.trim().replace(/\s+/g, "-");
  const cleanedSlug = slug.replace(/[^a-zA-Z0-9-]/g, "");
  return cleanedSlug.toLowerCase();
};

function isValidEmail(email: string): boolean {
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  if (email.split("@").length !== 2 || email.includes("..")) {
    return false;
  }
  return true;
}

const getFullName = (profile?: GeneralObject) => {
  if (!profile) {
    return "";
  }
  return `${profile["first_name"] || ""}${profile["middle_name"] ? ` ${profile["middle_name"]}` : ""
    }${profile["last_name"] ? ` ${profile["last_name"]}` : ""}`;
};

const randomString = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const areStringsEqual = (string1: string, string2: string) => {
  return (
    isValidString(string1) &&
    isValidString(string2) &&
    string1.toLowerCase() === string2.toLowerCase()
  );
};

const isValidTwitterUsername = (username: string): boolean => {
  const twitterUsernameRegex = /^[A-Za-z0-9_]{1,15}$/;
  return twitterUsernameRegex.test(username);
};

const isValidTelegramUsername = (username: string): boolean => {
  const telegramUsernameRegex = /^(?!.*__)[a-zA-Z][a-zA-Z0-9_]{4,31}(?<!_)$/;
  return telegramUsernameRegex.test(username);
};

const removeQueryParams = (route: string) => {
  return route.replace(/\?.*$/, "");
};

const combineRouteAndQueryParams = (
  route: string | undefined,
  query: GeneralObject,
  includeSlug: boolean = false
): string => {
  if (!route) {
    return "";
  }

  // Remove Next.js dynamic route patterns like [[...slug]] and specific slugs
  route = route.replace(/\[\[.*?\]\]|\/\[\.\.\..*?\]|\/slug/g, "");

  let finalURL = route;

  const queryParams = Object.keys(query)
    .filter((key) => includeSlug || key !== "slug")
    .map((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value
          .map((val) => `${key}=${encodeURIComponent(val)}`)
          .join("&");
      } else {
        return `${key}=${encodeURIComponent(value)}`;
      }
    })
    .join("&");

  if (queryParams) {
    finalURL += (finalURL.includes("?") ? "&" : "?") + queryParams;
  }

  return finalURL;
};

const addRouteToUrl = (
  route: string,
  newRoute: string,
  queryParams: GeneralObject
): string => {
  if (!isValidString(route) || !isValidString(newRoute)) {
    console.error("Invalid route or newRoute provided.");
    return route || "";
  }

  route = route.startsWith("/") ? route : `/${route}`;
  const updatedPathname = route.replace(/\/$/, "") + newRoute;

  return combineRouteAndQueryParams(updatedPathname, queryParams, false);
};

function isValidUUID(uuid: unknown): boolean {
  if (typeof uuid != "string") {
    return false;
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

const isImageUri = (uri: string) => {
  return (
    uri.includes("png") ||
    uri.includes("jpg") ||
    uri.includes("jpeg") ||
    uri.includes("gif") ||
    uri.includes("svg") ||
    uri.includes("webp") ||
    uri.includes("blob")
  );
};

export {
  addRouteToUrl,
  areStringsEqual,
  combineRouteAndQueryParams,
  copyTextToClipboard,
  formatCapitalize,
  getFullName, isImageUri, isValidEmail,
  isValidString,
  isValidTelegramUsername,
  isValidTwitterUsername,
  isValidUUID,
  randomString, removeQueryParams, shortenString,
  simpleSingularize,
  slugify
};

