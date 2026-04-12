import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  QueryClient as V2QueryClient,
  QueryClientProvider as V2QueryClientProvider,
} from "@tanstack/react-query";
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import { getDeviceId, getUserIfExists } from "@zo/utils/auth";
import { isClient } from "@zo/utils/next";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Spin } from "antd";
import axios, { HeadersDefaults } from "axios";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "react-query";
import { http, WagmiProvider } from "wagmi";
import { base, baseSepolia, goerli, mainnet, polygon } from "wagmi/chains";
import { ZoAuth } from "../../components";
import { setZoServerHeaders } from "../../utils";
import { AuthContext } from "./AuthContext";

const wagmiConfig = getDefaultConfig({
  appName: "Zo World",
  projectId: "43871bdb68fb1bc6696326b1a0714368",
  chains: [mainnet, goerli, polygon, base, baseSepolia],
  ssr: true,
  appIcon: "https://static.cdn.zo.xyz/media/zo-v2-dynamic.svg",
  appUrl: "https://zo.xyz",
  appDescription: "World's most exclusive web3 club",
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [goerli.id]: http(),
    [polygon.id]: http(),
    [baseSepolia.id]: http(),
  },
});

interface Header extends HeadersDefaults {
  "client-device-id"?: string;
  "client-device-secret"?: string;
  "client-key"?: string;
  Authorization?: string;
}

interface AuthProviderProps {
  localKey: string;
  isLoginRequired?: boolean;
  isZostelLoginRequired?: boolean;
  children: React.ReactNode;
  allowedLoginTypes?: LoginTypes[];
  showOtherLoginOptions?: boolean;
  skipOnboarding?: boolean;
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  localKey,
  children,
  allowedLoginTypes = ["email", "wallet", "mobile"],
  isLoginRequired,
  isZostelLoginRequired,
  showOtherLoginOptions = false,
  skipOnboarding = false,
}) => {
  const router = useRouter();
  const redirectPathRef = useRef<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceSecret, setDeviceSecret] = useState<string | null>(null);
  const [isLoggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [isLoginModalVisible, setLoginModalVisible] = useState<boolean>(false);
  const [loginTypes, setLoginTypes] = useState(allowedLoginTypes);

  const v2QueryClient = new V2QueryClient();

  const queryClient = useRef(
    new QueryClient({
      queryCache: new QueryCache({
        onError: async (error: any) => {
          // Log auth errors but do NOT auto-logout — a single 401/403 from
          // any Axios query (e.g. PROFILE_ME) was nuking the entire session
          // for normal users whose token lacked admin privileges.
          if (error?.response?.status === 403 || error?.response?.status === 401) {
            console.warn('[auth] Query returned', error.response.status, '— token may be invalid');
          }
        },
      }),
    })
  );

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
      const initialDeviceId = isClient
        ? localStorage.getItem(`${localKey}-device-id`)
        : null;
      const initialDeviceSecret = isClient
        ? localStorage.getItem(`${localKey}-device-secret`)
        : null;

      if (initialUser && isValidString(initialUser)) {
        setUser(getUserIfExists(initialUser));
      }

      let currentDeviceId = initialDeviceId;
      let currentDeviceSecret = initialDeviceSecret;
      if (isValidString(initialDeviceId)) {
        setDeviceId(initialDeviceId);
      } else {
        const _deviceId = getDeviceId();
        localStorage.setItem(`${localKey}-device-id`, _deviceId);
        currentDeviceId = _deviceId;
        console.log("generating device id: ", _deviceId);
        setDeviceId(_deviceId);
      }
      if (isValidString(initialDeviceSecret)) {
        setDeviceSecret(initialDeviceSecret);
      } else {
        const _deviceSecret = window.btoa(Date.now() + (currentDeviceId || ""));
        localStorage.setItem(`${localKey}-device-secret`, _deviceSecret);
        console.log("generating device secret: ", _deviceSecret);
        currentDeviceSecret = _deviceSecret;
        setDeviceSecret(_deviceSecret);
      }
      const customAxiosHeaders: Header = {
        ...axios.defaults.headers,
        "client-device-id": currentDeviceId || "",
        "client-device-secret": currentDeviceSecret || "",
        "client-key": process.env.APP_ID || "",
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
          customAxiosHeaders.Authorization = `Bearer ${initialToken}`;
          setTimeout(() => {
            setLoggedIn(true);
          }, 2000);
        } else {
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }

      console.log("Setting device headers:", customAxiosHeaders);
      setZoServerHeaders(customAxiosHeaders);
    } else {
      setZoServerHeaders(null);
    }
  }, [localKey]);

  useEffect(() => {
    if (isLoggedIn === false && isLoginRequired) {
      showLoginModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isLoginRequired]);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    localStorage.removeItem(`${localKey}-token`);
    localStorage.removeItem(`${localKey}-user`);
    localStorage.removeItem(`${localKey}-token-expiry`);
    localStorage.removeItem(`${localKey}-device-id`);
    localStorage.removeItem(`${localKey}-device-secret`);
    setTimeout(() => {
      queryClient.current?.clear();
    }, 1000);
    const _deviceId = getDeviceId();
    localStorage.setItem(`${localKey}-device-id`, _deviceId);
    console.log("generating device id: ", _deviceId);
    setDeviceId(_deviceId);
    const _deviceSecret = window.btoa(Date.now() + (_deviceId || ""));
    localStorage.setItem(`${localKey}-device-secret`, _deviceSecret);
    console.log("generating device secret: ", _deviceSecret);
    setDeviceSecret(_deviceSecret);
    const customAxiosHeaders: Header = {
      ...axios.defaults.headers,
      "client-device-id": _deviceId || "",
      "client-device-secret": _deviceSecret || "",
      "client-key": process.env.APP_ID || "",
    };
    setZoServerHeaders(customAxiosHeaders);
  }, [localKey]);

  const showLoginModal = useCallback(
    (allowedLoginTypes?: LoginTypes[], redirectPath?: string) => {
      logout();

      if (allowedLoginTypes) {
        setLoginTypes(allowedLoginTypes);
      }
      // Capture the redirect: explicit path takes priority, otherwise use current route
      redirectPathRef.current = redirectPath || router.asPath;
      setLoginModalVisible(true);
    },
    [logout, router.asPath]
  );

  const login = (user: AuthUser, token: string, validTill: number) => {
    localStorage.setItem(`${localKey}-token`, token);
    localStorage.setItem(`${localKey}-user`, JSON.stringify(user));
    localStorage.setItem(`${localKey}-token-expiry`, String(validTill));
    const customAxiosHeaders: Header = {
      ...axios.defaults.headers,
      "client-device-id": deviceId || "",
      "client-device-secret": deviceSecret || "",
      "client-key": process.env.APP_ID || "",
      Authorization: `Bearer ${token}`,
    };
    console.log("Setting device headers:", customAxiosHeaders);
    setZoServerHeaders(customAxiosHeaders);
    setUser(user);
    setTimeout(() => {
      setLoggedIn(true);
    }, 2000);
  };

  return (
    <QueryClientProvider client={queryClient.current}>
      <WagmiProvider config={wagmiConfig}>
        <V2QueryClientProvider client={v2QueryClient}>
          <RainbowKitProvider
            modalSize="compact"
            theme={darkTheme({
              accentColor: "#7b3fe4",
              accentColorForeground: "white",
              borderRadius: "medium",
            })}
          >
            <AuthContext.Provider
              value={{ isLoggedIn, logout, user, showLoginModal, login, skipOnboarding }}
            >
              {isLoginModalVisible ? (
                <ZoAuth
                  login={login}
                  isZostelLoginRequired={isZostelLoginRequired}
                  hideModal={setLoginModalVisible.bind(null, false)}
                  allowedLoginTypes={loginTypes}
                  showOtherLoginOptions={showOtherLoginOptions}
                  redirectPath={redirectPathRef.current}
                />
              ) : isLoginRequired ? (
                isLoggedIn ? (
                  children
                ) : (
                  <div className="flex justify-center items-center h-screen w-screen fixed top-0 left-0 bg-zui-dark">
                    <Spin
                      size="large"
                      className="text-zui-neon"
                    />
                  </div>
                )
              ) : (
                children
              )}
            </AuthContext.Provider>
          </RainbowKitProvider>
        </V2QueryClientProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default AuthProvider;
