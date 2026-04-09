import { FC } from "react";
interface AvatarProps { advanceOnboarding: () => void; }
const Avatar: FC<AvatarProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Avatar (stub)</span>
  </div>
);
export default Avatar;
