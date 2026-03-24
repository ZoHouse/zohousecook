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
      d="M4 3h16v2H4zM10 5h2v2h-2zM6 9h12v2H6z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="M12 7h2v6h-2zM8 13h4v2H8zM10 15h2v2h-2zM12 17h2v2h-2zM14 19h4v2h-4z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
