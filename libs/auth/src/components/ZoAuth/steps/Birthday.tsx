import { FC } from "react";
interface BirthdayProps { advanceOnboarding: () => void; }
const Birthday: FC<BirthdayProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Birthday (stub)</span>
  </div>
);
export default Birthday;
