import * as React from "react";
import { SVGProps, Ref, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="16"
    viewBox="0 0 18 16"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill="#111"
      fillRule="evenodd"
      d="M8.28.464a2 2 0 0 1 .256 2.816L6.27 6H16a2 2 0 1 1 0 4H6.27l2.266 2.72a2 2 0 1 1-3.072 2.56l-5-6a2 2 0 0 1 0-2.56l5-6A2 2 0 0 1 8.28.464Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
