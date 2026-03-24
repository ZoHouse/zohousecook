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
      fill={props.fill ? props.fill : "#5A5A5A"}
      d="M16.938 4h2.702l-5.902 6.791L20.707 20H15.23l-4.267-5.582L6.058 20H3.356l6.328-7.253L3 4h5.618l3.875 5.12L16.938 4Zm-.96 14.364h1.493L7.8 5.53H6.164l9.814 12.835Z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
