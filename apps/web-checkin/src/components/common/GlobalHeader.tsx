import { useAuth, useZostelAuth } from "@zo/auth";
import { isClient } from "@zo/utils/next";
import Image from "next/image";

const GlobalHeader = () => {
  const { isLoggedIn: isZoLoggedIn, logout: logoutZo } = useAuth();
  const { isLoggedIn: isZostelLoggedIn, logout: logoutZostel } =
    useZostelAuth();

  return (
    <div
      className={`flex items-center mb-6 ${
        isZoLoggedIn && isZostelLoggedIn ? "justify-between" : "justify-center"
      }`}
    >
      <Image
        src={
          "https://cdn.zo.xyz/gallery/media/images/9e5e45c5-05de-4266-bbb3-d6c83ee49af8_20250305131225.svg"
        }
        alt="Zostel"
        width={100}
        height={100}
        className="w-auto h-8"
      />
      {isZoLoggedIn && isZostelLoggedIn && (
        <button
          className="text-orange-600"
          onClick={() => {
            logoutZo();
            logoutZostel();
            if (isClient) {
              window.location.reload();
            }
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default GlobalHeader;
