/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import { createContext, useContext } from "react";

interface AuthContextInterface {
  isLoggedIn: boolean | null;
  logout: () => void;
  login: (user: AuthUser, token: string, validTill: number) => void;
  user: AuthUser | null;
  showLoginModal: (
    allowedLoginTypes?: LoginTypes[],
    redirectPath?: string
  ) => void;
}

const AuthContext = createContext<AuthContextInterface>({
  isLoggedIn: null,
  user: null,
  login: () => {},
  logout: () => {},
  showLoginModal: () => {},
});

const useAuth = () => useContext(AuthContext);

export { AuthContext, useAuth };
