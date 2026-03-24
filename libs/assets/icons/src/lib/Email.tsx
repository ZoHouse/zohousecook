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
      d="M2 6h2v12H2zM4 18h16v2H4zM4 4h16v2H4zM20 6h2v12h-2zM11 13h2v2h-2zM9 11h2v2H9zM7 9h2v2H7zM5 7h2v2H5zM17 7h2v2h-2zM13 11h2v2h-2zM15 9h2v2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
