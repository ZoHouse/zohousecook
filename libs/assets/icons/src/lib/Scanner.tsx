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
      d="M8 2a6 6 0 0 0-6 6 2 2 0 1 0 4 0 2 2 0 0 1 2-2 2 2 0 1 0 0-4Zm8 0a6 6 0 0 1 6 6 2 2 0 1 1-4 0 2 2 0 0 0-2-2 2 2 0 1 1 0-4ZM2 16a6 6 0 0 0 6 6 2 2 0 1 0 0-4 2 2 0 0 1-2-2 2 2 0 1 0-4 0Zm14 6a6 6 0 0 0 6-6 2 2 0 1 0-4 0 2 2 0 0 1-2 2 2 2 0 1 0 0 4Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
