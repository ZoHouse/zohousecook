import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="M9.65 7.333H8.317v1.333H9.65zM11.65 9.333h-1.333v1.333h1.333zM11.65 5.333h-1.333v1.333h1.333zM13.65 11.333h-1.333v1.333h1.333zM13.65 3.333h-1.333v1.333h1.333zM3.65 7.333H2.317v1.333H3.65zM5.65 9.333H4.317v1.333H5.65zM5.65 5.333H4.317v1.333H5.65zM7.65 11.333H6.317v1.333H7.65zM7.65 3.333H6.317v1.333H7.65z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
