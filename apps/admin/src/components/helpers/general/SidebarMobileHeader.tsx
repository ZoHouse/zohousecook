import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React from "react";

interface SidebarMobileHeaderProps {
  onBackClick: () => void;
  isBackButtonHidden?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
}

const SidebarMobileHeader: React.FC<SidebarMobileHeaderProps> = ({
  onBackClick,
  onClose,
  isBackButtonHidden = false,
  title,
  subtitle,
}) => {
  return (
    <header className={cn("flex flex-col items-start justify-between py-6")}>
      <div className={cn("flex w-full justify-between items-center", isBackButtonHidden && "justify-end")}>
        {!isBackButtonHidden && (
          <div className="flex items-center">
            <button
              className="flex items-center justify-center pointer-events-auto"
              onClick={onBackClick}
            >
              <Icon name="ArrowLeft" size={24} fill="#FFF" />
            </button>
          </div>
        )}

        <div className="flex items-center self-end">
          <button
            className="h-9 w-9 flex items-center justify-center pointer-events-auto"
            onClick={onClose}
          >
            <Icon name="Cross" size={24} fill="#FFF" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 mt-4">
        <h2 className="text-2xl font-medium capitalize w-full">{title}</h2>
        {isValidString(subtitle) && (
          <span className="text-base text-zui-silver mt-1">{subtitle}</span>
        )}
      </div>
    </header>
  );
};

export default SidebarMobileHeader;
