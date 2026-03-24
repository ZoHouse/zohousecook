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
      d="M4.5 3h2v20h-2zM8.5 3h2v14h-2zM6.5 17h14v2h-14zM6.5 21h10v2h-10zM16.5 19h2v2h-2zM6.5 1h12v2h-12z"
    />
    <path fill={props.fill || "#5a5a5a"} d="M18.5 3h2v16h-2z" />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
