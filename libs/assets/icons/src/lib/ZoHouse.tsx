import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="28"
    viewBox="0 0 24 28"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      fillRule="evenodd"
      d="M24 9.137 12 0 0 9.137v17.921h3.574V10.941L12 4.526l8.425 6.415v16.117H24V9.137Zm-17.179 8.37h5.027L6.383 24.47v2.347h10.928v-3.364h-5.329l5.51-6.962v-2.346H6.822v3.364Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
