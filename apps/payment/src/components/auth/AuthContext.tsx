/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import { createContext, useContext } from "react";

interface AuthContextInterface {
  login: (user: any, token: any, validTill: any) => void;
  logout: () => void;
  walletConnected?: boolean;
  updateWalletConnected?: (connected: boolean) => void;
}

const AuthContext = createContext<AuthContextInterface>({
  login: () => {},
  logout: () => {},
  walletConnected: false,
  updateWalletConnected: () => {},
});

const useAuth = () => useContext(AuthContext);

export { AuthContext, useAuth };
