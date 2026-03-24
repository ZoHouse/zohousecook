import { GeneralObject } from "@zo/definitions/general";
import { getUserIfExists } from "@zo/utils/auth";
import { isClient } from "@zo/utils/next";
import { isValidObject } from "@zo/utils/object";
import { isValidString, randomString } from "@zo/utils/string";
import axios from "axios";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { setZostelServerHeaders } from "../../utils";
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
        const parsedDate = +new Date(initialTokenExpiry || "");
        const parsedUser = getUserIfExists(initialUser);
        if (
          isValidObject(parsedUser) &&
          isValidString(parsedUser?.id) &&
          isValidString(initialToken) &&
          parsedDate > +new Date()
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
    localStorage.clear();
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
