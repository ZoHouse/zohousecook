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
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="M2 10h2V8H2zM8 22h2v-2H8zM14 10h2V8h-2zM4 8h4V6H4zM10 20h4v-2h-4zM16 8h4V6h-4zM5 4h2V2H5zM11 16h2v-2h-2zM17 4h2V2h-2zM8 10h2V8H8zM14 22h2v-2h-2zM20 10h2V8h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
