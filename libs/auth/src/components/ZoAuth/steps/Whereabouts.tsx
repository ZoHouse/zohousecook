import { FC } from "react";
interface WhereaboutsProps { advanceOnboarding: () => void; }
const Whereabouts: FC<WhereaboutsProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Whereabouts (stub)</span>
  </div>
);
export default Whereabouts;
