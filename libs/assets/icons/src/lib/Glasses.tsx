import * as React from "react";
import { SVGProps, Ref, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    ref={ref}
    {...props}
  >
    <path fill={props.fill || "#fff"} d="M3.333 15h33.333v3.333H3.333z" />
    <path
      fill={props.fill || "#fff"}
      d="M10 18.333h11.667v3.333H10zM13.333 21.667h5V25h-5zM28.333 21.667h5V25h-5zM25 18.333h11.667v3.333H25z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
