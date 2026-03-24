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
      fillRule="evenodd"
      d="M6 3h12v2h2v2h2v6h-2v2h-2v2H8v2H6v2H4v-2H2V7h2V5h2V3Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
