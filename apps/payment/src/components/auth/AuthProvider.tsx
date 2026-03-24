import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  QueryClient as V2QueryClient,
  QueryClientProvider as V2QueryClientProvider,
} from "@tanstack/react-query";
import axios, { HeadersDefaults } from "axios";
import { setZoServerHeaders } from "libs/auth/src/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../../config";
import { AuthContext } from "./AuthContext";

interface Header extends HeadersDefaults {
  "wallet-signed-message"?: any;
  "wallet-address"?: any;
  "wallet-signature"?: any;
}

interface AuthProviderProps {
  isLoginRequired?: boolean;
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState<boolean>();

  const v2QueryClient = new V2QueryClient();

  const queryClient = useRef(new QueryClient({}));

  useEffect(() => {
    if (!walletConnected && walletConnected !== undefined) {
      localStorage.clear();
    }

    const wallet_address = localStorage.getItem(`walletAddress`);
    const message = localStorage.getItem(`walletMessage`);
    const signature = localStorage.getItem(`walletSignature`);
    if (signature) {
      setWalletConnected(true);
    }

    const customAxiosHeaders: Header = {
      ...axios.defaults.headers,
      "wallet-signed-message": wallet_address || "",
      "wallet-address": message || "",
      "wallet-signature": signature || "",
    };
    setZoServerHeaders(customAxiosHeaders);
  }, [walletConnected]);

  const login = (wallet_address: any, message: any, signature: any) => {
    localStorage.setItem(`walletMessage`, wallet_address);
    localStorage.setItem(`walletAddress`, message);
    localStorage.setItem(`walletSignature`, signature);
    const customAxiosHeaders: Header = {
      ...axios.defaults.headers,
      "wallet-signed-message": message || "",
      "wallet-address": wallet_address || "",
      "wallet-signature": signature || "",
    };
    setZoServerHeaders(customAxiosHeaders);

    setWalletConnected(true);
  };

  const updateWalletConnected = (connected: boolean) => {
    setWalletConnected(connected);
  };

  const logout = useCallback(() => {
    setWalletConnected(false);
    localStorage.clear();
    setTimeout(() => {
      queryClient.current?.clear();
    }, 1000);

    const customAxiosHeaders: Header = {
      ...axios.defaults.headers,
    };
    setZoServerHeaders(customAxiosHeaders);
  }, [walletConnected]);

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
              value={{
                login,
                logout,
                walletConnected,
                updateWalletConnected,
              }}
            >
              {children}
            </AuthContext.Provider>
          </RainbowKitProvider>
        </V2QueryClientProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default AuthProvider;
