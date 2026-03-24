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
      d="M9 11h2v2H9zM9 17h2v2H9zM3 11h2v2H3zM3 17h2v2H3zM1 13h2v4H1zM11 13h2v4h-2zM5 9h4v2H5zM5 19h4v2H5zM11 9h2v2h-2zM13 7h2v2h-2zM15 9h2v2h-2zM15 5h2v2h-2zM17 3h2v2h-2zM19 5h2v2h-2zM21 7h2v2h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
