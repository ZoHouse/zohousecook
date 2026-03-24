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
      fillRule="evenodd"
      d="M4.464 12.72a2 2 0 0 1 2.816-.256L10 14.73V5a2 2 0 1 1 4 0v9.73l2.72-2.266a2 2 0 1 1 2.56 3.072l-6 5a2 2 0 0 1-2.56 0l-6-5a2 2 0 0 1-.256-2.816Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
