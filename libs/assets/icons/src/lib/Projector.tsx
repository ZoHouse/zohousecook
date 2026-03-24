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
      fill={props.fill || "#fff"}
      d="M2 6h2v8H2zM11 2h2v2h-2zM9 16h2v2H9zM5 20h2v2H5zM18 20h2v2h-2zM7 18h2v2H7zM16 18h2v2h-2zM14 16h2v2h-2zM4 14h16v2H4zM4 4h16v2H4zM20 6h2v8h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
