import { Portal } from "@radix-ui/react-select";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { cn, fontClassName } from "@zo/utils/font";
import { useOutsideClick } from "@zo/utils/hooks";
import { Moment } from "moment";
import React from "react";
import { CSSTransition } from "react-transition-group";

interface BookingContextMenuProps {
  x: number;
  y: number;
  verticalPosition: "top" | "bottom";
  horizontalPosition: "left" | "right";
  inventory: GeneralObject;
  skuId: string;
  date: Moment;
  hasBooking: boolean;
  width: number;
  onNewBooking: () => void;
  onNewLocking: () => void;
  height: number;
  onClose: () => void;
}

const BookingContextMenu: React.FC<BookingContextMenuProps> = ({
  x,
  y,
  verticalPosition,
  horizontalPosition,
  inventory,
  skuId,
  onNewBooking,
  onNewLocking,
  date,
  hasBooking,
  width,
  height,
  onClose,
}) => {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  useOutsideClick(contextMenuRef, onClose);

  return (
    <Portal>
      <CSSTransition
        classNames="fade-in"
        in={true}
        unmountOnExit
        mountOnEnter
        timeout={300}
        nodeRef={contextMenuRef}
        appear
      >
        <div
          className={cn("absolute flex flex-col", fontClassName)}
          ref={contextMenuRef}
          style={{
            top: y,
            left: x,
            transformOrigin: `${horizontalPosition} ${verticalPosition}`,
            transform: `translateX(${
              horizontalPosition === "right" ? "-100%" : "0"
            }) translateY(${verticalPosition === "bottom" ? "-100%" : "0"})`,
            width,
            height,
          }}
        >
          <div className="flex flex-col p-4 bg-zui-dark border-zui-dark border border-b-0 text-sm gap-y-1">
            <span className="truncate overflow-hidden">
              {inventory.skus.length > 1
                ? `${inventory.skus.find((i: any) => i.id === skuId)?.name} • ${
                    inventory.name
                  }`
                : inventory.name}
            </span>
            <span className="text-zui-silver text-xs">
              {date.format("ddd DD MMM")}
            </span>
          </div>
          <ul className="flex flex-col gap-y-1 py-3 text-sm border-zui-lighter border border-t-0 bg-zui-light">
            <li
              className={cn(
                "flex items-center gap-x-3 px-4 py-1 cursor-pointer",
                !hasBooking ? "hover:text-zui-neon" : "text-zui-silver"
              )}
              onClick={onNewBooking}
            >
              <Icon name="Checkin" size={16} fill="#5a5a5a" />
              <span>Create Booking</span>
            </li>
            <li
              className={cn(
                "flex items-center gap-x-3 px-4 py-1 cursor-pointer",
                !hasBooking ? "hover:text-zui-neon" : "text-zui-silver"
              )}
              onClick={onNewLocking}
            >
              <Icon name="CalendarAdd" size={16} fill="#5a5a5a" />
              <span>Add Locking</span>
            </li>
          </ul>
        </div>
      </CSSTransition>
    </Portal>
  );
};

export default BookingContextMenu;
