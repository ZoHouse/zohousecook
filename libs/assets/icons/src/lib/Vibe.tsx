import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
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
    <path
      fill={props.fill || "#fff"}
      d="M30 30h3.333V20H30zM33.333 20h3.333v-3.333h-3.333zM20 30h3.333v-3.333H20zM3.333 13.333h3.333V6.666H3.333zM6.667 20H10v-6.667H6.667zM26.667 20H30v-6.667h-3.333zM20 20h3.333v-6.667H20zM13.333 20h3.333v-6.667h-3.333zM10 30h3.333V20H10zM13.333 33.333H30V30H13.333z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
