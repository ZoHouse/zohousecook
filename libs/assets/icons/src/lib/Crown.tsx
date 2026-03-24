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
    fill={props.fill || "#FFF"}
    ref={ref}
    {...props}>
    <path
      fill={props.fill || "#FFF"}
      d="M4 17h16v2H4zM2 17h2v-4H2zM22 17h-2v-4h2zM2 11h2V9H2zM4 13h2v-2H4zM6 15h2v-2H6zM8 13h2v-2H8zM14 13h2v-2h-2zM11 11h2V9h-2zM12 8l1.414-1.414L12 5.172l-1.414 1.414zM21.414 8l1.414-1.414-1.414-1.414L20 6.586zM3.414 7.828l1.414-1.414L3.414 5 2 6.414zM18 13h2v-2h-2zM16 15h2v-2h-2zM20 11h2V9h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
