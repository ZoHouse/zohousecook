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
      fill={props.fill || "#5a5a5a"}
      d="M13 4V2h-2v2zM11 20v2h2v-2zM15 6V4h-2v2zM9 18v2h2v-2zM17 8V6h-2v2zM7 16v2h2v-2zM11 6V4H9v2zM13 18v2h2v-2zM9 8V6H7v2zM15 16v2h2v-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
