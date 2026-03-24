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
      fill={props.fill || "#202020"}
      d="M1 8h2v8H1zM8 9h2v2H8zM17 10h2v2h-2zM15 12h2v2h-2zM6 11h2v2H6zM3 6h2v2H3zM19 6h2v2h-2zM19 16h2v2h-2zM3 16h2v2H3zM10 11h2v2h-2zM8 13h2v2H8zM21 8h2v8h-2zM5 4h14v2H5zM5 18h14v2H5z"
      />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;

