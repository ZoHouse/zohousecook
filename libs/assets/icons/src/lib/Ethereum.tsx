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
      d="m8.092 1.333-.09.304v8.816l.09.09 4.093-2.42-4.093-6.79Z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="M8.092 1.333 4 8.123l4.092 2.42v-9.21ZM8.092 11.318l-.05.06v3.141l.05.148L12.187 8.9l-4.095 2.418Z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="M8.092 14.667v-3.35L4 8.9l4.092 5.767Z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
