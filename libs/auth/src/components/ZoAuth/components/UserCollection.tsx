import React from "react";
import { ZoAuthFocus } from "../ZoAuth";

interface UserCollectionProps {
  focus: ZoAuthFocus;
}

const UserCollection: React.FC<UserCollectionProps> = () => {
  return (
    <div className="flex-1 hidden md:flex bg-zui-dark relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-zui-dark/60" />
    </div>
  );
};

export default UserCollection;
