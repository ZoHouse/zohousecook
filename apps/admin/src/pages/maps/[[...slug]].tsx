"use client";

import { Loader } from "@zo/assets/lotties";
import dynamic from "next/dynamic";

const ZoMap = dynamic(() => import("../../components/helpers/maps/ZoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full justify-center items-center">
      <Loader className="h-10 w-10" />
    </div>
  ),
});

const Index = () => (
  <main>
    <ZoMap />
  </main>
);

export default Index;
