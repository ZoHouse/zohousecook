import type { GetServerSideProps } from "next";
import React from "react";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "https://zo.house/network",
      permanent: true,
    },
  };
};

const Club: React.FC = () => null;

export default Club;
