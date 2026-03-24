import Icon from "@zo/assets/icons";
import React from "react";

export interface TweetProps {
  media: string;
  user: {
    name: string;
    username: string;
    profilePicture: string;
  };
  tweet: string;
  link: string;
}

const Tweet: React.FC<TweetProps> = ({ link, media, tweet, user }) => {

  return (
    <div className="w-[392px] bg-zui-light">
      <div className="w-[392px] h-[264px]"> 
        <img
          className="h-full w-full object-cover"
          src={media}
          height={392}
          width={264}
          alt="tweet"
        />
      </div>
      <div className="p-6">
         <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 ">
          <img
            className="h-8 w-8"
            src={user.profilePicture || "/PFP.png"}
            alt="Profile Picture"
            height={32}
            width={32}
          />
          <div className="flex flex-col items-start text-sm text-zui-silver">
            <strong className="font-semibold text-white">{user.name}</strong>
            {user.username}
          </div>
        </div>
        <button>
          <Icon name="NewTab" size={24} fill="#fff" />
        </button>
      </div>
      <span className="text-sm font-medium">
        {tweet}
      </span>
      </div>
     
    </div>
  );
};

export default Tweet;
