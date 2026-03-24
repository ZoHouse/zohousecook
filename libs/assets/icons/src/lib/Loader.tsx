import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      d="M18.667 4.667h18.667v4.667H18.667zM46.667 18.667h4.667v18.667h-4.667zM42 14h4.667v4.667H42z"
    />
    <path
      fill={props.fill || "#fff"}
      d="M37.333 9.333H42V14h-4.667zM42 42h4.667v-4.667H42zM37.333 46.667H42V42h-4.667z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
