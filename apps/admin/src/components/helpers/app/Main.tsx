/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth, useProfile } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Head } from "@zo/moal";
import { NextComponentType, NextPageContext } from "next";
import React, { useMemo, useCallback } from "react";
import Navigation from "./Navigation";
import { navigationLinks } from "../../../config";
import { Typography, Button, Flex } from "antd";
import LockPersonOutlinedIcon from "@mui/icons-material/LockPersonOutlined";
const { Title, Text } = Typography;

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
}

const Main: React.FC<MainProps> = ({ Component, pageProps }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const { profile } = useProfile();

  const isCasAdmin = useMemo(
    () => user?.roles?.includes("cas-admin"),
    [user?.roles]
  );

  const handleClearCacheAndReload = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const UnauthorizedContent = useMemo(
    () => (
      <main className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <LockPersonOutlinedIcon
            color="error"
            sx={{ fontSize: 48, marginBottom: 2 }}
          />
          <Title level={2}>Unauthorized Access</Title>
          <Text>You do not have permission to access this area.</Text>
          <Flex justify="center" align="center">
            <Text>Got permission?</Text>
            <Button type="link" onClick={handleClearCacheAndReload}>
              Clear Cache & Reload
            </Button>
          </Flex>
        </div>
      </main>
    ),
    [handleClearCacheAndReload]
  );

  if (isLoggedIn && user && !isCasAdmin) {
    return UnauthorizedContent;
  }

  return (
    <main className="scrollbar flex font-normal min-h-screen w-full transition-all ease-in-out duration-200">
      <Head />
      <div className="flex w-full h-full">
        <Navigation
          navigationLinks={navigationLinks}
          profile={profile}
          logout={logout}
        />
        <div className="flex-1 overflow-x-hidden">
          <Component {...pageProps} />
        </div>
      </div>
    </main>
  );
};

export default Main;
