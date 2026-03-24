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
      d="M9.955 14.942V9.015l5.227 2.964-5.227 2.963ZM21.582 7.15a2.509 2.509 0 0 0-1.768-1.773c-1.56-.42-7.814-.42-7.814-.42s-6.254 0-7.814.42c-.86.23-1.538.91-1.768 1.773C2 8.715 2 11.98 2 11.98s0 3.264.418 4.828c.23.863.908 1.543 1.768 1.774C5.746 19 12 19 12 19s6.254 0 7.814-.42c.86-.23 1.538-.91 1.768-1.773C22 15.243 22 11.98 22 11.98s0-3.264-.418-4.829Z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
