import { FC } from "react";
interface CulturesProps { advanceOnboarding: () => void; }
const Cultures: FC<CulturesProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Cultures (stub)</span>
  </div>
);
export default Cultures;
