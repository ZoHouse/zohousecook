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
      d="M5 5h14v2H5zM3 7h2v2H3zM1 9h2v2H1zM3 11h2v2H3zM21 11h-2v2h2zM5 13h2v2H5zM19 13h-2v2h2zM7 15h2v2H7zM9 17h2v2H9zM13 17h2v2h-2zM11 19h2v2h-2zM17 15h-2v2h2zM21 9h2v2h-2zM19 7h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
