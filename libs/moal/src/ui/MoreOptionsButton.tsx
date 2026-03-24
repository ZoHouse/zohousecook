import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useOutsideClick } from "@zo/utils/hooks";
import React, { useRef, useState } from "react";

interface MoreOptionsButtonProps {
  icon?: IconName;
  options: Array<{ label: string; onClick: () => void; icon?: IconName }>;
  menuClassName?: string;
  className?: string;
}

const MoreOptionsButton: React.FC<MoreOptionsButtonProps> = ({
  options,
  menuClassName,
  className,
  icon = "More",
}) => {
  const [isMenuOpen, setMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  return (
    <>
      <button
        className={className}
        onClick={setMenuOpen.bind(null, !isMenuOpen)}
      >
        <Icon name={icon} size={24} fill="#fff" />
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute w-36 bg-zui-lighter border border-zui-silver divide-y divide-zui-light top-4 right-4",
            menuClassName
          )}
        >
          {options.map((option) => (
            <button
              className="text-zui-white flex items-center justify-center py-3 gap-3 w-full bg-zui-light hover:bg-zui-lighter/50"
              onClick={option.onClick}
            >
              {option.icon && <Icon name={option.icon} size={16} fill="#fff" />}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default MoreOptionsButton;
