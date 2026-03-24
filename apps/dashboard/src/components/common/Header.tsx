/* eslint-disable @typescript-eslint/no-empty-interface */
import { FounderBadge, Zo } from "@zo/assets/brands";
import { useAuth, useProfile } from "@zo/auth";
import { formatAddress } from "@zo/utils/web3";
import Link from "next/link";
import React, { useState } from "react";
import Headroom from "react-headroom";
import { useDisconnect } from "wagmi";
import { useGoto } from "../../hooks";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const goTo = useGoto();
  const { logout, isLoggedIn, showLoginModal } = useAuth();
  const { profile } = useProfile();
  const { disconnect } = useDisconnect();

  const [isMenuVisible, setMenuVisible] = useState<boolean>(false);

  const toggleMenu = () => {
    setMenuVisible((v) => !v);
  };

  const signOut = async () => {
    disconnect();
    logout();
  };

  const connectWallet = () => {
    showLoginModal();
  };

  return (
    <>
      {isMenuVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleMenu}
        />
      )}
      <Headroom>
        <header className="w-full  mx-auto max-w-[1400px] w-full px-6 lg:px-[108px] py-4 flex items-center justify-between mx-auto">
          <Link href={process.env.WEB_BASE_URL || "/"}>
            <Zo className="h-6 portrait:h-4" fill="rgb(249, 250, 251)" />
          </Link>

          {isLoggedIn === true ? (
            <button
              className="flex items-center space-x-2 relative text-zui-white"
              onClick={toggleMenu}
            >
              {profile?.pfp_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.pfp_image}
                  alt=""
                  className="w-6 h-6 border border-zui-white rounded-full"
                />
              ) : (
                <i className="text-xl uil-user-circle" />
              )}
              <span className="text-inherit">
                {profile?.nickname || formatAddress(profile?.wallet_address)}
              </span>
              {profile?.membership === "founder" && (
                <FounderBadge className="h-6" />
              )}
              <i className="text-xl text-inherit uil-angle-down" />
              {isMenuVisible && (
                <ul className="absolute top-[100%] text-zui-white right-0 min-w-full bg-zui-black border-2 border-zui-white z-10 flex flex-col items-stretch">
                  <li>
                    <button
                      className="flex items-center space-x-2 p-4 pr-8 w-full hover:bg-zui-white hover:text-zui-black"
                      onClick={goTo.bind(
                        null,
                        "https://zo.xyz/dashboard",
                        false
                      )}
                    >
                      <i className="uil uil-dashboard" />
                      <span>Dashboard</span>
                    </button>
                  </li>
                  {/* <li>
                    <button
                      className="flex items-center space-x-2 p-4 pr-8 w-full hover:bg-zui-white hover:text-zui-black"
                      onClick={window.open.bind(
                        null,
                        "https://zo.xyz/me/bookings",
                        "_parent"
                      )}
                    >
                      <i className="uil uil-book" />
                      <span>Bookings</span>
                    </button>
                  </li> */}
                  <li>
                    <button
                      className="flex items-center space-x-2 p-4 pr-8 w-full hover:bg-zui-red hover:text-zui-white"
                      onClick={signOut}
                    >
                      <i className="uil uil-sign-out-alt" />
                      <span>Disconnect</span>
                    </button>
                  </li>
                </ul>
              )}
            </button>
          ) : (
            <button
              className="flex items-center space-x-2 relative font-semibold text-zui-white"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </header>
      </Headroom>
    </>
  );
};

export default Header;
