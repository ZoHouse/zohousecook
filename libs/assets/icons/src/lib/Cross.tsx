import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "currentColor" || "#FFF"}
      fillRule="evenodd"
      d="M19.071 7.757a2 2 0 0 0-2.828-2.828L12 9.172 7.757 4.929A2 2 0 0 0 4.93 7.757L9.172 12l-4.243 4.243a2 2 0 1 0 2.828 2.828L12 14.83l4.243 4.242a2 2 0 1 0 2.828-2.828L14.828 12l4.243-4.243Z"
      clipRule="evenodd"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
