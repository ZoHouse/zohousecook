import { GeneralObject } from "@zo/definitions/general";
import { getUserIfExists } from "@zo/utils/auth";
import { isClient } from "@zo/utils/next";
import { isValidObject } from "@zo/utils/object";
import { isValidString, randomString } from "@zo/utils/string";
import axios from "axios";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { parseTokenExpiry, setZostelServerHeaders } from "../../utils";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
  localKey: string;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children, localKey }) => {
  const [user, setUser] = useState<any>();
  const [isLoggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (localKey) {
      const initialToken = isClient
        ? localStorage.getItem(`${localKey}-token`)
        : null;
      const initialUser = isClient
        ? localStorage.getItem(`${localKey}-user`)
        : null;
      const initialTokenExpiry = isClient
        ? localStorage.getItem(`${localKey}-token-expiry`)
        : null;

      if (initialUser && isValidString(initialUser)) {
        setUser(getUserIfExists(initialUser));
      }

      const customAxiosHeaders: GeneralObject = {
        ...axios.defaults.headers,
        "Client-User-Id": randomString(10),
        "Client-App-Id": process.env.ZOSTEL_APP_ID || "",
      };
      if (isValidString(initialTokenExpiry)) {
        // valid_till is persisted as a numeric epoch (ms or s) or ISO
        // string. `+new Date("1745000000000")` returned NaN for pure-digit
        // strings, NaN > now is false → setLoggedIn(false) on every
        // refresh. Same bug PR #19 fixed on the zo provider; the fix is
        // now shared via parseTokenExpiry in libs/auth/src/utils.ts.
        const parsedDate = parseTokenExpiry(initialTokenExpiry);
        const parsedUser = getUserIfExists(initialUser);
        if (
          isValidObject(parsedUser) &&
          isValidString(parsedUser?.id) &&
          isValidString(initialToken) &&
          Number.isFinite(parsedDate) &&
          parsedDate > Date.now()
        ) {
          customAxiosHeaders["Client-User-Id"] = (parsedUser as any)?.user_id;
          customAxiosHeaders.Authorization = `Bearer ${initialToken}`;
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }
      console.log("Setting device headers:", customAxiosHeaders);
      setZostelServerHeaders(customAxiosHeaders);
    }
  }, [localKey]);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    // Only remove zostel keys — localStorage.clear() was destroying
    // zo-admin-* tokens and all other app state
    localStorage.removeItem(`${localKey}-token`);
    localStorage.removeItem(`${localKey}-user`);
    localStorage.removeItem(`${localKey}-token-expiry`);
    const customAxiosHeaders: GeneralObject = {
      ...axios.defaults.headers,
      "Client-User-Id": randomString(10),
      "Client-App-Id": process.env.ZOSTEL_APP_ID || "",
    };
    setZostelServerHeaders(customAxiosHeaders);
  }, [localKey]);

  const login = (user: GeneralObject, token: string, validTill: string) => {
    localStorage.setItem(`${localKey}-token`, token);
    localStorage.setItem(`${localKey}-user`, JSON.stringify(user));
    localStorage.setItem(`${localKey}-token-expiry`, String(validTill));
    const customAxiosHeaders = {
      ...axios.defaults.headers,
      "Client-App-Id": process.env.ZOSTEL_APP_ID || "",
      "Client-User-Id": user.user_id,
      Authorization: `Bearer ${token}`,
    };
    console.log("Setting device headers:", customAxiosHeaders);
    setZostelServerHeaders(customAxiosHeaders);
    setUser(user);
    setLoggedIn(true);
  };

  return (
    <AuthContext.Provider
      value={{
        logout,
        login,
        user,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
