/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Portal } from "@radix-ui/react-select";
import Icon, { IconName } from "@zo/assets/icons";
import { cn, fontClassName } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import { Button, IconButton } from "libs/moal/src";
import React, { useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import "../styles.css";
import StepProgress from "./StepProgress";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  disableOutsideTapClose?: boolean;
  className?: string;
  scrollableChildren?: boolean;
  headerOptions?: {
    title?: string;
    subtitle?: string;
    hasCloseButton?: boolean;
    isAbsolute?: boolean;
    className?: string;
  };
  footerOptions?: {
    progressOptions?: {
      totalSteps: number;
      activeStep: number;
    };
    actionButtons: Array<{
      label?: string;
      icon?: IconName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: (...args: any[]) => void;
      className?: string;
      type: "primary" | "secondary" | "icon";
      disabled?: boolean;
      isHidden?: boolean;
    }>;
    footerClassName?: string;
    isHidden?: boolean;
  };
  headerClassName?: string;
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  headerOptions,
  scrollableChildren = true,
  className,
  onClose,
  footerOptions,
  headerClassName,
  disableOutsideTapClose = false,
  children,
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
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
        classNames="fade-in"
        in={isOpen}
        unmountOnExit
        mountOnEnter
        timeout={300}
        nodeRef={overlayRef}
        appear
      >
        <section
          ref={overlayRef}
          className={cn(
            fontClassName,
            "fixed z-50 top-0 right-0 bottom-0 left-0"
          )}
        >
          <div
            className="fixed top-0 right-0 bottom-0 left-0 bg-zui-dark/80"
            onClick={!disableOutsideTapClose ? onClose : undefined}
          />
          <CSSTransition
            classNames="fade-left"
            in={isOpen}
            unmountOnExit
            mountOnEnter
            timeout={300}
            nodeRef={pageRef}
            appear
          >
            <aside
              ref={pageRef}
              className={cn(
                "fixed bg-zui-lighter top-0 right-0 bottom-0 flex flex-col max-w-[1020px] w-full",
                ""
              )}
            >
              {headerOptions && (
                <header
                  className={cn(
                    "flex flex-shrink-0 items-start justify-between w-full px-6 md:px-10 py-6 border-b border-zui-light",
                    headerOptions.isAbsolute &&
                      "absolute top-0 right-0 pointer-events-none",
                    headerOptions.className,
                    headerClassName
                  )}
                >
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-medium capitalize w-full">
                      {headerOptions.title}
                    </h2>
                    {headerOptions.subtitle && (
                      <span className="text-base text-zui-silver mt-1">
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
                        <Icon name="Cross" size={24} fill="#FFF" />
                      </button>
                    )}
                  </div>
                </header>
              )}
              <div
                className={cn(
                  "w-screen md:w-[1020px] px-6 md:px-10 flex-1 flex flex-col",
                  scrollableChildren ? "overflow-y-auto" : "overflow-y-hidden",
                  className
                )}
              >
                {children}
              </div>
              {footerOptions && !footerOptions.isHidden && (
                <footer
                  className={cn(
                    "w-full relative border-t border-zui-light bg-zui-lighter px-6 md:px-10 py-6 flex items-center justify-between",
                    footerOptions.footerClassName
                  )}
                >
                  {footerOptions?.progressOptions && (
                    <StepProgress
                      steps={footerOptions?.progressOptions.totalSteps}
                      step={footerOptions?.progressOptions.activeStep}
                    />
                  )}
                  {footerOptions.actionButtons &&
                    footerOptions.actionButtons.length > 0 && (
                      <div
                        className={cn(
                          "flex-1 flex items-center gap-4",
                          footerOptions.actionButtons.filter(
                            (button) => !button.isHidden
                          ).length <= 1
                            ? "justify-end"
                            : "justify-between"
                        )}
                      >
                        {footerOptions.actionButtons
                          .filter((button) => !button.isHidden)
                          .map((button, index) =>
                            button.type === "icon" ? (
                              <IconButton
                                icon={button.icon}
                                onClick={button.onClick}
                                className={button.className}
                                fill="#fff"
                                isDisabled={button.disabled}
                                size={24}
                              />
                            ) : (
                              <Button
                                key={index}
                                onClick={button.onClick}
                                type={button.type}
                                icon={button.icon}
                                disabled={button.disabled}
                                className={cn(
                                  "md:flex-none",
                                  button.disabled
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer",
                                  !isValidString(button.label) && "w-fit",
                                  button.className
                                )}
                              >
                                {button.label || ""}
                              </Button>
                            )
                          )}
                      </div>
                    )}
                </footer>
              )}
            </aside>
          </CSSTransition>
        </section>
      </CSSTransition>
    </Portal>
  );
};

export default Sidebar;
