import Icon, { IconName } from "@zo/assets/icons";
import React from "react";

interface BenefitsProps {}

const BENEFITS = [
  {
    icon: "Key",
    iconColor: "#FFD600",
    text: "Unlock the door to Zo Houses: exclusive, luxurious, and culturally enriching spaces",
  },
  {
    icon: "Gift",
    iconColor: "#FF2F8E",
    text: "Benefit from special drops and more, curated specifically for our founder members",
  },
  {
    icon: "Ticket",
    iconColor: "#66DF48",
    text: "Receive invitations to high-profile events, reserved only for our esteemed founders",
  },
  {
    icon: "Diamond",
    iconColor: "#6A77DD",
    text: "Enjoy founder-level access to Zo Studio, the hub of creative and digital innovation",
  },
  {
    icon: "Game",
    iconColor: "#FF9E4C",
    text: "Exclusive Zo Club entry: connect, collaborate, and celebrate with fellow founders",
  },
  {
    icon: "People",
    iconColor: "#9803CE",
    text: "Gain privileged entry to a vibrant, exclusive Zo World community network",
  },
];

const Benefits: React.FC<BenefitsProps> = () => {
  return (
    <div className="flex flex-col mt-48 items-start justify-start">
      <h2 className="zui-heading-1">
        Privileges of being a Founder of Zo World
      </h2>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
        {BENEFITS.map((b, i) => (
          <li
            key={i}
            className="p-4 lg:p-10 space-y-10 border-zui-light bg-zui-lighter border zui-text-1 flex flex-col items-start"
          >
            <Icon name={b.icon as IconName} size={40} fill={b.iconColor} />
            <span className="flex-1 flex items-end">{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Benefits;
