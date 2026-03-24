import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    ref={ref}
    {...props}
  >
    <circle cx={11.667} cy={11.666} r={5} fill="#fff" />
    <circle cx={11.667} cy={28.334} r={5} fill="#fff" />
    <circle cx={28.333} cy={11.666} r={5} fill="#fff" />
    <circle cx={28.333} cy={28.334} r={5} fill="#fff" />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
