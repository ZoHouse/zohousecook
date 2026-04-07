import React from "react";
import { rubikClassName } from "../utils/font";
import QuestCard from "./QuestCard";

const SAMPLE_QUESTS = [
  {
    title:
      "Create a Reel on: Why I'd choose Zostel Pahalgam for my next trip",
    type: "reel" as const,
    status: "live" as const,
    timeRemaining: "12h 14m",
  },
  {
    title: "Why I'd choose Zostel Pahalgam for my next trip",
    type: "reel" as const,
    status: "submitted" as const,
  },
];

const QuestsSection: React.FC = () => {
  return (
    <div>
      <h2
        className={`${rubikClassName} font-medium text-white mb-4`}
        style={{ fontSize: 20 }}
      >
        Quests
      </h2>
      <div className="flex flex-col gap-4">
        {SAMPLE_QUESTS.map((quest, index) => (
          <QuestCard key={index} {...quest} />
        ))}
      </div>
    </div>
  );
};

export default QuestsSection;
