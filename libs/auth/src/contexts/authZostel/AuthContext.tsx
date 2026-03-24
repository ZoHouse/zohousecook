import { createContext, useContext } from "react";

interface GeneralObject {
  [key: string]: any;
}

interface AuthContextType {
  isLoggedIn: boolean | null;
  user: GeneralObject | null;
  login: (user: GeneralObject, token: string, tokenExpiry: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: null,
  login: () => {},
  logout: () => {},
});

const useZostelAuth = () => useContext(AuthContext);

export { AuthContext, useZostelAuth };
