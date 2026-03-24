import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./Dialog";

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (state: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  children,
  title,
  description,
  onOpenChange,
  isOpen,
  className,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        )}
        {children}
        {/* <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <button type="button">Close</button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
