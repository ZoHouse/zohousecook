import React from "react";
import { MetaTags } from "../components/common/MetaTags";
import {
  NetworkHero,
  ZoEffect,
  AlumniDirectory,
  ChemistryCard,
  Events,
  MentorStack,
  NetworkCTA,
} from "../components/helpers/network";
import events from "../config/membership-events";

const Network: React.FC = () => {
  return (
    <main className="bg-black min-h-screen text-white snap-y snap-proximity scroll-smooth">
      <MetaTags
        title="The Network · Zo House"
        description="Builders, founders, and operators who lived and built at India's permanent startup house."
      />
      <NetworkHero />
      <ZoEffect />
      <AlumniDirectory />
      <ChemistryCard />
      <Events events={events} />
      <MentorStack />
      <NetworkCTA />
    </main>
  );
};

export default Network;
