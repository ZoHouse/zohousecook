import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import {
  Achievements,
  BentoGrid,
  DashboardHeader,
  PassportCard,
  LiveUpdates,
  NftStaking,
  MemberDirectory,
  QuestContainer,
  ZoBalance,
  BenefitContainer,
} from "../components/dashboard";
import type { NextPageWithLayout } from "./_app";

const DashboardPage: NextPageWithLayout = () => {
  const { basePath } = useRouter();
  return (
    <div
      className="flex-1 min-h-screen bg-dash-bg-solid"
      style={{
        backgroundImage: `url(${basePath}/dashboard-assets/dashboard-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <DashboardHeader />

      <BentoGrid>
        {/* Left column: Passport + Member Directory stacked */}
        <div className="lg:row-span-2 flex flex-col gap-dash-xl">
          <PassportCard />
          <MemberDirectory />
          <Achievements />
        </div>

        {/* Center column: LiveUpdates + Quests stacked */}
        <div className="lg:row-span-2 flex flex-col gap-dash-xl">
          <LiveUpdates />
          <QuestContainer />
        </div>

        {/* Right column: NFTs + Balance stacked */}
        <div className="lg:row-span-2 flex flex-col gap-dash-xl">
          <NftStaking />
          <ZoBalance />
        </div>

        {/* Full width bottom */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <BenefitContainer />
        </div>
      </BentoGrid>
    </div>
  );
};

DashboardPage.getLayout = (page: ReactElement) => page;

export default DashboardPage;
