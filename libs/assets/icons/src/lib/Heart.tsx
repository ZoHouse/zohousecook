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
      d="M11 6h2v2h-2zM11 18h2v2h-2zM15 14h2v2h-2zM13 4h6v2h-6zM17 12h2v2h-2zM7 14h2v2H7zM9 16h2v2H9zM13 16h2v2h-2zM5 4h2v2H5z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="M5 4h6v2H5zM5 12h2v2H5zM3 6h2v6H3zM19 6h2v6h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
