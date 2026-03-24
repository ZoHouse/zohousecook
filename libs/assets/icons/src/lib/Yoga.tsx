import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24" viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="M5 9h2v2H5zM5 13h2v2H5zM3 11h2v2H3zM9 5h2v2H9zM11 3h2v2h-2zM11 11h2v2h-2zM13 13h2v2h-2zM9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM9 17h2v2H9zM11 19h2v2h-2zM13 17h2v2h-2zM13 5h2v2h-2zM17 13h2v2h-2zM19 11h2v2h-2zM17 9h2v2h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
