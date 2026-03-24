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
      fill="#66DF48"
      fillRule="evenodd"
      d="M8 2h8v2h2v2h2v2h2v8h-2v2h-2v2h-2v2H8v-2H6v-2H4v-2H2V8h2V6h2V4h2V2Z"
      clipRule="evenodd"
    />
    <path
      fill="#202020"
      d="M10 11H8v2h2v-2ZM12 13h-2v2h2v-2ZM14 11h-2v2h2v-2ZM16 9h-2v2h2V9Z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
