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
      fill={props.fill || "#fff"}
      d="M6 2h2v2H6zM4 20h16v2H4zM4 4h16v2H4zM2 6h2v14H2zM20 6h2v14h-2zM16 2h2v2h-2zM7 12h4v2H7zM11 8h2v4h-2zM11 14h2v4h-2zM13 12h4v2h-4z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
