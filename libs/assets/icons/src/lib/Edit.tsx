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
      fill={props.fill || "#5a5a5a"}
      d="m17.657 3.515 2.828 2.829-1.414 1.414-2.828-2.829zM6.343 14.829l2.828 2.828-1.414 1.414-2.828-2.828z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="m5.636 16.95 1.414 1.414-1.414 1.414-1.414-1.414zM14.828 3.515l1.414 1.414-9.9 9.9-1.414-1.415zM19.071 7.757l1.414 1.414-9.899 9.9-1.414-1.414z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
