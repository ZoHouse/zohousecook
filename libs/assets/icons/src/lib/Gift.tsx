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
    <path
      fill={props.fill || "#fff"}
      d="M3.333 10h3.333v6.667H3.333zM21.667 1.667H25V5h-3.333zM15 1.667h3.333V5H15zM18.333 10h3.333v23.333h-3.333zM6.667 23.333H10v10H6.667zM30 23.333h3.333v10H30z"
    />
    <path
      fill={props.fill || "#fff"}
      d="M6.667 16.667h26.667V20H6.667zM10 33.333h20v3.333H10zM6.667 6.667h26.667V10H6.667zM33.333 10h3.333v6.667h-3.333z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
