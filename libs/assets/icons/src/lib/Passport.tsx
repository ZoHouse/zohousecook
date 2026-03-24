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
      d="M2 6h2v12H2zM4 18h16v2H4zM4 4h16v2H4zM4 11h3v2H4zM17 11h3v2h-3zM20 6h2v12h-2zM11 13h2v2h-2zM11 9h2v2h-2zM9 11h2v2H9zM13 11h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
