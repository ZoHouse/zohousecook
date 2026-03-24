"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import Icon from "@zo/assets/icons";
import { cn, fontClassName } from "@zo/utils/font";
import * as React from "react";

const RootSelect = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full space-x-4 items-center justify-between border border-zui-light px-4 text-xs placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <Icon name="AngleDown" fill="#FFF" size={16} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center", className)}
    {...props}
  >
    <Icon name="AngleUp" fill="#FFF" size={16} />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center", className)}
    {...props}
  >
    <Icon name="AngleDown" fill="#FFF" size={16} />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden border bg-zui-dark border-zui-light border-t-0 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-0 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-2",
        className,
        fontClassName
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[calc(var(--radix-select-trigger-width)-2px)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-4 py-3 flex  text-zui-silver items-center text-xs",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex  justify-between w-full h-10 text-xs px-4 cursor-pointer select-none items-center outline-none focus:bg-zui-lighter data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="relative ml-3 flex items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Icon name="Check" fill="#CFFF50" size={16} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export interface SelectPropsOptions {
  label: string;
  value: string;
  icon?: string;
}
interface SelectProps {
  className?: string;
  placeholder: string;
  selectContentClassName?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<SelectPropsOptions>;
}

const Select: React.FC<SelectProps> = ({
  className,
  selectContentClassName,
  placeholder,
  value,
  onChange,
  options,
}) => {
  return (
    <RootSelect value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value
            ? options.find((option) => option.value === value)?.label
            : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={selectContentClassName}>
        <SelectGroup>
          {options.map((option) => (
            <React.Fragment key={option.value}>
              <hr className="horizontal-divider " />
              <SelectItem
                value={option.value}
                className="flex items-center gap-x-2"
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                <span>{option.label}</span>
              </SelectItem>
            </React.Fragment>
          ))}
        </SelectGroup>
      </SelectContent>
    </RootSelect>
  );
};

export default Select;
