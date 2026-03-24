import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useState } from "react";
interface AvatarProps {
  src?: string;
  size?: number;
  isFounder: boolean;
  alt?: string;
  className?: string;
  badgeOffset?: number;
  badgeSize?: number;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  size = 24,
  isFounder,
  alt = "Zo",
  className,
  badgeOffset = -4,
  badgeSize = 16,
}) => {
  const [isError, setError] = useState<boolean>(false);

  const initial = alt?.split("")?.[0] || "U";

  return (
    <div className={cn("relative w-fit flex-shrink-0", className)}>
      {src && !isError ? (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img
          className="object-cover profile-clip-path"
          height={size}
          width={size}
          src={src}
          onError={setError.bind(null, true)}
          onLoad={setError.bind(null, false)}
          alt="Profile Picture"
        />
      ) : (
        <div
          className="bg-zui-neon grid place-content-center profile-clip-path text-zui-dark font-medium"
          style={{
            width: size,
            height: size,
          }}
        >
          {initial}
        </div>
      )}
      {isFounder && (
        <span
          className="absolute"
          style={{
            bottom: badgeOffset,
            right: badgeOffset,
          }}
        >
          <Icon name="FounderBadgeBordered" size={badgeSize} />
        </span>
      )}
    </div>
  );
};

export default Avatar;
