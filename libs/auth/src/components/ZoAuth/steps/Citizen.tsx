import { FC } from "react";
interface CitizenProps { advanceOnboarding: () => void; }
const Citizen: FC<CitizenProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Citizen (stub)</span>
  </div>
);
export default Citizen;
