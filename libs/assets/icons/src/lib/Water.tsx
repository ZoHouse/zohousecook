import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24" viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="M6 14h2v-2H6zM6 18h2v-2H6zM12 14h2v-2h-2zM12 18h2v-2h-2zM18 14h2v-2h-2zM18 18h2v-2h-2zM5 12h2v-2H5zM5 16h2v-2H5zM11 12h2v-2h-2zM11 16h2v-2h-2zM17 12h2v-2h-2zM17 16h2v-2h-2zM6 10h2V8H6zM12 10h2V8h-2zM18 10h2V8h-2zM5 8h2V6H5zM11 8h2V6h-2zM17 8h2V6h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
