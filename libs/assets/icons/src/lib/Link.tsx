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
      d="m16.95 4.222 2.828 2.829-1.414 1.414-2.828-2.829zM11.293 9.88l2.828 2.827-1.414 1.415-2.828-2.829zM5.636 15.536l2.828 2.828L7.05 19.78 4.22 16.95zM14.121 4.222l1.414 1.414-4.242 4.243-1.415-1.415zM8.464 9.879l1.414 1.414-4.243 4.242-1.414-1.414z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="m18.364 8.464 1.415 1.414-4.243 4.243-1.414-1.414zM12.707 14.12l1.414 1.415-4.242 4.243-1.414-1.414z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
