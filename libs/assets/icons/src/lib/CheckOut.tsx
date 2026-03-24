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
      d="M6 2h2v2H6zM4 20h16v2H4zM4 4h16v2H4zM2 6h2v14H2zM20 6h2v14h-2zM16 2h2v2h-2zM18 12h-8v2h8zM8 12H6v2h2zM10 10H8v2h2zM12 8h-2v2h2zM10 14H8v2h2zM12 16h-2v2h2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
