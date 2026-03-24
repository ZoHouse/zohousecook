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
    fill={props.fill || "#FFF"}
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#FFF"}
      d="M6 2h2v2H6zM4 20h16v2H4zM4 4h16v2H4zM2 6h2v14H2zM20 6h2v14h-2zM16 2h2v2h-2zM6 12h8v2H6zM16 12h2v2h-2zM14 10h2v2h-2zM12 8h2v2h-2zM14 14h2v2h-2zM12 16h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
