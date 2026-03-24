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
      d="M8 2h2v20H8zM16 2h2v20h-2zM4 2h2v6H4zM6 8h2v2H6zM10 8h2v2h-2zM18 2h2v8h-2zM12 2h2v6h-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
