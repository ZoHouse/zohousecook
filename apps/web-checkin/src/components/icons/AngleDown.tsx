import * as React from "react";
import { SVGProps, Ref, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="8"
    viewBox="0 0 12 8"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill="#111"
      d="M1.057 6.943c.52.52 1.364.52 1.885 0L6 3.886l3.058 3.057a1.333 1.333 0 0 0 1.885-1.886l-4-4a1.333 1.333 0 0 0-1.885 0l-4 4c-.521.52-.521 1.365 0 1.886Z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
