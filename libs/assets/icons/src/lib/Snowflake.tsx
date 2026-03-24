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
      fill={props.fill || "#202020"}
      d="M9 11h2v2H9zM5 11h2v2H5zM3 13h2v2H3zM3 9h2v2H3zM13 11h2v2h-2zM15 7h2v2h-2zM15 15h2v2h-2zM7 15h2v2H7zM7 7h2v2H7zM17 11h2v2h-2zM19 13h2v2h-2zM19 9h2v2h-2zM11 11V9h2v2zM11 7V5h2v2zM9 5V3h2v2zM13 5V3h2v2zM11 15v-2h2v2zM11 19v-2h2v2zM9 21v-2h2v2zM13 21v-2h2v2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
