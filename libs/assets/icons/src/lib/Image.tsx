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
      d="M2 6h2v12H2zM4 18h16v2H4zM4 4h16v2H4zM20 6h2v12h-2zM6 14h2v2H6zM4 16h2v2H4zM16 16h2v2h-2zM8 12h2v2H8zM10 10h2v2h-2zM16 8h2v2h-2zM12 12h2v2h-2zM14 14h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
