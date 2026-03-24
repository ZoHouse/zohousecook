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
      fill={props.fill || "#5A5A5A"}
      fillRule="evenodd"
      d="M4.586 16.414a2 2 0 0 0 2.828 0L12 11.828l4.586 4.586a2 2 0 1 0 2.828-2.828l-6-6a2 2 0 0 0-2.828 0l-6 6a2 2 0 0 0 0 2.828Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
