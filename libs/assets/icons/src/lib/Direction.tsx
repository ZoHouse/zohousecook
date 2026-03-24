import * as React from "react";
import { SVGProps, Ref, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      fillRule="evenodd"
      d="M6.48.976a1.333 1.333 0 0 0-.171 1.878l1.51 1.813H4a4 4 0 0 0-4 4V10a1.333 1.333 0 1 0 2.667 0V8.667c0-.737.597-1.334 1.333-1.334h3.82L6.309 9.147a1.333 1.333 0 1 0 2.049 1.707l3.333-4a1.333 1.333 0 0 0 0-1.707l-3.333-4A1.333 1.333 0 0 0 6.48.976Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
