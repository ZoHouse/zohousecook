import { cn } from "@zo/utils/font";
import moment from "moment";
import React, { useState } from "react";
import { rubikClassName } from "../../utils";

export interface TweetCardProps {
  tweetContent: string;
  tweetLink: string;
  username: string;
  name: string;
  timestamp: string;
  pfp?: string;
  className?: string;
}

const TweetCard: React.FC<TweetCardProps> = ({
  name,
  timestamp,
  tweetContent,
  tweetLink,
  username,
  className,
  pfp,
}) => {
  const [pfpError, setPfpErros] = useState<boolean>(false);
  const gotoTweet = () => window.open(tweetLink);

  return (
    <div
      onClick={gotoTweet}
      role="button"
      className={cn(
        "w-[312px] md:w-[392px] h-[240px] p-6 rounded-2xl inner-border bg-zui-dark flex flex-col",
        rubikClassName,
        className
      )}
    >
      <span className="text-base font-medium flex-1 truncate whitespace-normal overflow-hidden text-ellipsis">
        {tweetContent}
      </span>
      <div className="mt-6 flex items-center gap-3 flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full">
          {pfp && !pfpError ? (
            <img
              onError={setPfpErros.bind(null, true)}
              src={pfp}
              alt="pfp"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full object-cover bg-zui-silver flex items-center justify-center">
              {username ? username[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div className="text-sm">
          <h6>{name}</h6>
          <p className="text-zui-silver">
            {username} • {moment(timestamp).format("ll")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
