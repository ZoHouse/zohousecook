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
      d="M5 20h2V4H5zM17 20h2V4h-2zM7 4h10V2H7zM7 22h2v-2H7zM9 20h2v-2H9zM9 8h6V6H9zM9 12h2v-2H9zM11 22h2v-2h-2zM13 20h2v-2h-2zM15 22h2v-2h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
