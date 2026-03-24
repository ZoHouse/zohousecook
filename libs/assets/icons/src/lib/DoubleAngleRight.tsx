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
      d="M6.35 8.667h1.333V7.334H6.35zM4.35 6.667h1.333V5.334H4.35zM4.35 10.667h1.333V9.334H4.35zM2.35 4.667h1.333V3.334H2.35zM2.35 12.667h1.333v-1.333H2.35zM12.35 8.667h1.333V7.334H12.35zM10.35 6.667h1.333V5.334H10.35zM10.35 10.667h1.333V9.334H10.35zM8.35 4.667h1.333V3.334H8.35zM8.35 12.667h1.333v-1.333H8.35z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
