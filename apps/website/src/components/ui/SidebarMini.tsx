"use client";

import { Portal } from "@radix-ui/react-select";
import Icon, { IconName } from "@zo/assets/icons";
import { Button } from "@zo/moal";
import { cn, fontClassName } from "@zo/utils/font";
import React, { useEffect } from "react";
import { CSSTransition } from "react-transition-group";

export interface SidebarMiniProps {
  isOpen: boolean;
  onClose: () => void;
  disableOutsideTapClose?: boolean;
  headerOptions?: {
    title?: string;
    subtitle?: string;
    hasCloseButton?: boolean;
    isAbsolute?: boolean;
  };
  footerOptions?: {
    progressOptions?: {
      totalSteps: number;
      activeStep: number;
      onBackPress?: () => void;
    };
    actionButtons?: Array<{
      label: string;
      onClick?: () => void;
      icon?: IconName;
      className?: string;
      type?: "primary" | "secondary";
      disabled?: boolean;
    }>;
  };
  children: React.ReactNode;
}

const SidebarMini: React.FC<SidebarMiniProps> = ({
  isOpen,
  headerOptions,
  onClose,
  footerOptions,
  disableOutsideTapClose = false,
  children,
}) => {
  const pageRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  return (
    <Portal>
      <CSSTransition
        classNames="fade-left"
        in={isOpen}
        unmountOnExit
        mountOnEnter
        timeout={300}
        nodeRef={pageRef}
        appear
      >
        <section
          ref={pageRef}
          className={cn(
            fontClassName,
            "fixed top-0 right-0 bottom-0 left-0 z-50",
            isOpen ? "overflow-hidden" : ""
          )}
        >
          <div
            className={cn(
              "fixed top-0 right-0 bottom-0 left-0 bg-zui-dark opacity-80",
              isOpen ? "overflow-hidden" : ""
            )}
            onClick={!disableOutsideTapClose ? onClose : undefined}
          ></div>
          <aside
            className={cn(
              "fixed bg-zui-lighter top-0 right-0 bottom-0 flex flex-col",
              ""
            )}
          >
            {headerOptions && (
              <header
                className={cn(
                  "flex flex-shrink-0 items-start justify-between w-full px-10 py-6",
                  headerOptions.isAbsolute &&
                    "absolute top-0 right-0 pointer-events-none"
                )}
              >
                <div className="flex flex-col">
                  <h2 className="text-2xl font-medium capitalize">
                    {headerOptions.title}
                  </h2>
                  {headerOptions.subtitle && (
                    <span className="text-xs text-zui-silver mt-1">
                      {headerOptions.subtitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  {headerOptions.hasCloseButton && (
                    <button
                      className="h-9 w-9 flex items-center justify-center pointer-events-auto"
                      onClick={onClose}
                    >
                      <Icon
                        name="Cross"
                        size={24}
                        className="hover:text-zui-neon"
                      />
                    </button>
                  )}
                </div>
              </header>
            )}
            <div
              className={cn(
                "w-[300px] md:w-[400px] px-10 flex-1 flex flex-col overflow-y-auto"
              )}
            >
              {children}
            </div>
            {footerOptions && (
              <footer className="flex-shrink-0 relative border-t border-zui-light bg-zui-lighter px-10 py-6 w-full flex items-center justify-between">
                {footerOptions.actionButtons &&
                  footerOptions.actionButtons.length > 0 && (
                    <div className="flex w-full space-x-4">
                      {footerOptions.actionButtons.map((button, index) => (
                        <Button
                          key={index}
                          onClick={button.onClick}
                          type={button.type}
                          icon={button.icon}
                          disabled={button.disabled}
                          className={button.className}
                        >
                          {button.label}
                        </Button>
                      ))}
                    </div>
                  )}
              </footer>
            )}
          </aside>
        </section>
      </CSSTransition>
    </Portal>
  );
};

export default SidebarMini;
