import { useAuth } from "@zo/auth";
import { useEffect } from "react";

const useLogin = () => {
  const { isLoggedIn, showLoginModal } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      showLoginModal();
    }
  }, [isLoggedIn, showLoginModal]);

  return { isLoggedIn };
};

export default useLogin;
