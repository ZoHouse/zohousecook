import { useLeafletContext } from "@react-leaflet/core";
import { Control, ControlPosition, DomEvent, DomUtil } from "leaflet";
import React, { ReactNode, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface CustomControlProps {
  position: ControlPosition;
  children?: ReactNode;
}

const CustomControl: React.FC<CustomControlProps> = ({
  position,
  children,
}) => {
  const context = useLeafletContext();
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const CustomControlClass = Control.extend({
      onAdd() {
        const container = DomUtil.create("div");
        DomEvent.disableClickPropagation(container);
        controlRef.current = container;
        return container;
      },
    });

    const control = new CustomControlClass({ position });
    const map = context.map;
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [context, position]);

  return controlRef.current
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ReactDOM.createPortal(children as any, controlRef.current)
    : null;
};

export default CustomControl;
