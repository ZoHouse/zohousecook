import { FC } from "react";
interface NicknameProps { advanceOnboarding: () => void; }
const Nickname: FC<NicknameProps> = ({ advanceOnboarding }) => (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-white/40">Nickname (stub)</span>
  </div>
);
export default Nickname;
