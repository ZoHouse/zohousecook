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
      d="M8 3h8v2H8zM6 5h2v2H6zM11 9h2v2h-2zM6 13h2v2H6zM10 17h2v2h-2zM11 19h2v2h-2zM18 5h-2v2h2zM18 13h-2v2h2zM14 17h-2v2h2zM16 15h-2v2h2zM10 15H8v2h2zM4 7h2v6H4zM20 7h-2v6h2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
