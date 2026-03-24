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
      fillRule="evenodd"
      d="M12.72 19.536a2 2 0 0 1-.256-2.816L14.73 14H5a2 2 0 1 1 0-4h9.73l-2.266-2.72a2 2 0 1 1 3.072-2.56l5 6a2 2 0 0 1 0 2.56l-5 6a2 2 0 0 1-2.816.256Z"
      clipRule="evenodd"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
