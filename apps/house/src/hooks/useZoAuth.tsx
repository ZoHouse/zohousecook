import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthUser, clearSession, loadSession, StoredSession } from "../lib/auth";
import { LoginModal } from "../components/LoginModal";

interface ShowLoginOptions {
  onSuccess?: (session: StoredSession) => void;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  showLoginModal: (opts?: ShowLoginOptions) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  showLoginModal: () => undefined,
  logout: () => undefined,
});

export function ZoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const onSuccessRef = useRef<((s: StoredSession) => void) | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s) setUser(s.user);
  }, []);

  const showLoginModal = useCallback((opts?: ShowLoginOptions) => {
    onSuccessRef.current = opts?.onSuccess ?? null;
    setModalOpen(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const handleSuccess = useCallback((session: StoredSession) => {
    setUser(session.user);
    setModalOpen(false);
    onSuccessRef.current?.(session);
    onSuccessRef.current = null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoggedIn: !!user, showLoginModal, logout }),
    [user, showLoginModal, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalOpen && (
        <LoginModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useZoAuth() {
  return useContext(AuthContext);
}
