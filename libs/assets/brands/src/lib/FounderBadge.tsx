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
      fill="#FF2F8E"
      d="m12 2 2.947 2.886 4.124.043.043 4.124L22 12l-2.886 2.947-.043 4.124-4.124.043L12 22l-2.947-2.886-4.124-.043-.043-4.124L2 12l2.886-2.947.043-4.124 4.124-.043L12 2Z"
    />
    <path
      fill="#fff"
      d="M11.5 14.174h3.386v1.972H8.829v-1.902l3.245-3.93H8.857V8.34h5.959v1.903l-3.315 3.93Z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
