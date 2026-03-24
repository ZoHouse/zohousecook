import React from "react";

interface UpdatesHeroSectionProps {}

const UpdatesHeroSection: React.FC<UpdatesHeroSectionProps> = () => {
  return (
    <section className="h-screen flex items-center my-[222px]">
      <div className="flex flex-col gap-20 ">
        <h1 className="heading">A tale of a ship</h1>
        <span className="sub-heading w-[70%] ">
          Zo Zo Zo to all explorers of the decentralised seas! Zo World brings a
          tale of a blockchain ship, sailing uncharted territories with dreams,
          connections, and a revolutionary vision for the future of humanity.
        </span>
      </div>
    </section>
  );
};

export default UpdatesHeroSection;
