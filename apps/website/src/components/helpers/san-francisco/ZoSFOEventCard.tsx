import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import moment from "moment";
import { MouseEventHandler, useMemo } from "react";
import { rubikClassName } from "../../utils";
interface ZoSFOEventCard {
  id?: string;
  size: "sm" | "lg";
  title: string;
  time: string;
  price: string;
  subcategory: string;
  operator: string;
  image: string;
  registrationLink: string;
  location: string;
  className?: string;
  navigationLink?: string;
  onClick?: () => void;
  tags?: string[];
}
export const ZoSFOEventCard: React.FC<ZoSFOEventCard> = ({
  title,
  time,
  id,
  price,
  subcategory,
  operator,
  image,
  registrationLink,
  location,
  className,
  size,
  navigationLink,
  onClick,
  tags = [],
}) => {
  const gotoRegisterationPage: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    window.open(registrationLink, "_blank");
  };
  const openNavigationLink: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    window.open(navigationLink, "_blank");
  };

  const displayTime = useMemo(() => {
    return moment(time).isSame(moment(), "day")
      ? `In ${moment(time).fromNow(true)}`
      : moment(time).format("h:mm A");
  }, [time]);

  return (
    <div
      id={id}
      data-pid={id}
      title={title}
      role="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer p-4 border border-zui-stroke rounded-2xl bg-zui-dark hover:bg-zui-light box-border",
        size === "sm" ? "space-y-3" : " grid grid-cols-2 gap-4",
        rubikClassName,
        className
      )}
    >
      <div className={cn("flex overflow-hidden", size === "sm" && "gap-2")}>
        <img
          src={
            isValidString(image)
              ? image
              : `${process.env.MEDIA_BASE_URL}/gallery/media/images/4c23ff61-a687-4195-89f9-54c9c526fafe_20240913133757.png`
          }
          className={cn(
            " object-cover border border-zui-stroke rounded-lg",
            size === "sm" ? "h-16 w-16 aspect-square" : "h-full"
          )}
          alt=""
        />
        {size === "sm" && (
          <div className="w-full">
            <h2
              className={cn(
                "text-zui-white text-base font-semibold truncate",
                rubikClassName
              )}
            >
              {title.substring(0, 15)} {title.length > 15 && "..."}
            </h2>
            <span className="flex items-center justify-between text-zui-silver text-sm font-medium">
              <p>{displayTime}</p>
              <p>{price}</p>
            </span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "text-sm text-zui-silver",
          size === "lg" && "flex flex-col justify-between"
        )}
      >
        <div>
          {size === "lg" && (
            <div>
              <h2
                className={cn(
                  "text-zui-white text-base font-semibold",
                  rubikClassName
                )}
              >
                {title}
              </h2>
              <span className="flex items-center justify-between text-zui-silver text-sm font-medium">
                <p className="bg-zui-green px-2 py-1 text-xs rounded-full font-semibold">
                  {displayTime}
                </p>
                <p>{price}</p>
              </span>
            </div>
          )}
          {isValidString(subcategory) && (
            <p
              className={cn(
                "font-medium mt-3 text-sm",
                size === "lg" && "mt-6 tracking-[1%]"
              )}
            >
              🤝 {subcategory}
            </p>
          )}
          <div
            className={cn(
              "flex items-center",
              isValidString(location) ? "justify-between" : "justify-end"
            )}
          >
            {isValidString(location) && (
              <p
                className={cn(
                  "text-sm font-medium tracking-[1%]",
                  size === "lg" && "mt-2"
                )}
              >
                📍 {location}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              {size === "sm" && isValidString(registrationLink) && (
                <button
                  onClick={gotoRegisterationPage}
                  className="text-zui-white text-xs font-medium py-2 px-3 border border-zui-stroke rounded-full"
                >
                  Register
                </button>
              )}
              {size === "sm" && isValidString(navigationLink) && (
                <button
                  onClick={openNavigationLink}
                  className="text-zui-white text-xs font-medium py-3 px-3 border border-zui-stroke rounded-full bg-zui-dark"
                >
                  <Icon size={12} name="Direction" />
                </button>
              )}
            </div>
          </div>
        </div>
        {size === "lg" && (
          <div className="flex items-center justify-end gap-4">
            {isValidString(registrationLink) && (
              <button
                onClick={gotoRegisterationPage}
                className="text-zui-white text-sm font-medium py-2 px-3 border border-zui-stroke rounded-full bg-zui-dark"
              >
                Register
              </button>
            )}
            {isValidString(navigationLink) && (
              <button
                onClick={openNavigationLink}
                className="text-zui-white text-sm font-medium py-3 px-3 border border-zui-stroke rounded-full bg-zui-dark"
              >
                <Icon size={12} name="Direction" />
              </button>
            )}
          </div>
        )}
      </div>
      {tags && tags.length > 0 && (
        <ul className="flex items-center gap-2">
          {tags.slice(0, 3).map((tag) => (
            <li
              className="text-xxs border border-zui-stroke px-3 py-1 rounded-full"
              key={tag}
            >
              #{tag}
            </li>
          ))}
          {tags.length > 3 && (
            <li className="text-xxs px-3 py-1">+{tags.length - 3}</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ZoSFOEventCard;
