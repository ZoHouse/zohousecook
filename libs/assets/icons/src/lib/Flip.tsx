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
    {...props}>
    <path
      fill={props.fill || "#fff"}
      d="M8 2h8v2H8zM16 22H8v-2h8zM20 8h2v2h-2zM4 16H2v-2h2zM2 4h2v4H2zM22 20h-2v-4h2zM2 8h6v2H2zM22 16h-6v-2h6zM6 4h2v2H6zM18 20h-2v-2h2zM18 6h2v2h-2zM6 18H4v-2h2zM16 4h2v2h-2zM8 20H6v-2h2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
