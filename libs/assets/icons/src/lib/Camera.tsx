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
      d="M2 6h2v12H2zM4 18h16v2H4zM4 4h16v2H4zM20 6h2v12h-2zM6 2h4v2H6zM13 13h2v2h-2zM11 11h2v2h-2zM6 8h2v8H6zM13 9h2v2h-2zM15 11h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
