import { FC } from "react";
interface HometownProps { advanceOnboarding: () => void; }
const Hometown: FC<HometownProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Hometown (stub)</span>
  </div>
);
export default Hometown;
