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
      d="M8 2h8v2H8zM8 22h8v-2H8zM2 8h2v8H2zM20 8h2v8h-2zM4 6h2v2H4zM6 4h2v2H6zM4 18h2v-2H4zM6 20h2v-2H6zM18 6h2v2h-2zM16 4h2v2h-2zM18 18h2v-2h-2zM16 20h2v-2h-2zM12 7h-2v5h2zM17 12h-5v2h5z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
