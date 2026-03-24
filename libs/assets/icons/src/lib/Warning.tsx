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
      fill={props.fill || "currentColor" || "#fff"}
      d="M10 2h4v2h-4zM10 20h4v2h-4zM11 8h2v4h-2zM6 6h2v2H6zM8 16H6v2h2zM18 18h-2v-2h2zM4 8h2v2H4zM10 18H8v2h2zM20 16h-2v-2h2zM2 10h2v4H2zM20 10h2v4h-2zM18 8h2v2h-2zM8 4h2v2H8zM6 14H4v2h2zM16 20h-2v-2h2zM16 6h2v2h-2zM14 4h2v2h-2zM11 14h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
