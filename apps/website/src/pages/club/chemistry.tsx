import type { GetServerSideProps } from "next";
import React from "react";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "https://zo.house/chemistry",
      permanent: true,
    },
  };
};

const ClubChemistry: React.FC = () => null;

export default ClubChemistry;
