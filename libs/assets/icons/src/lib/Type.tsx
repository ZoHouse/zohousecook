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
      d="M10 14h4v2h-4zM6 2h2v2H6zM18 2h2v2h-2zM6 12h2v-2H6zM4 4h2v2H4zM16 4h2v6h-2zM18 10h2v2h-2zM4 10h2V8H4zM2 6h2v2H2zM8 4h2v2H8zM20 4h2v6h-2zM8 10h2V8H8zM10 6h2v2h-2zM10 20h4v2h-4zM8 16h2v4H8zM14 16h2v4h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
