import React from "react";
import { useFadeInOnScroll } from "../../../hooks";

interface ConnectSectionProps {}

const ConnectSection: React.FC<ConnectSectionProps> = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  return (
    <section ref={sectionRef} id="about">
      <img
        className="w-72 mx-auto"
        src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/511bc1dc-df7e-4e59-a9f3-95bb77d150e9_20240821144336.png`}
        alt=""
      />
      <h2 className="sub-heading-2 text-center mt-6">
        Zo World <br />
        <span className="text-zui-yellow">Follow your Heart</span>
      </h2>

      <p className="mt-6 sub-text-1 text-zui-silver text-center w-full md:w-[60%] mx-auto">
        Zo World is a community of travellers, artists, technologists, and
        entrepreneurs with access to luxurious clubhouses, hostels & hotels and
        a local friend everywhere in the world. <br />
        <br />
        The best of technology, people and lifestyle experiences, promoting
        great vibes, expression, and culture.
        <br />
        <br /> Its all that, and more. If You Zo, You Zo!
      </p>

      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
    </section>
  );
};

export default ConnectSection;
