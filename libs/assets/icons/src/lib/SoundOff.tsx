import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="19"
    viewBox="0 0 24 19"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M10.985 17.74A2 2 0 0 0 12 16V2A2 2 0 0 0 8.971.285L4.446 3H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.446l4.525 2.715a2 2 0 0 0 2.014.025ZM8 12.468l-1.971-1.183A2 2 0 0 0 5 11H4V7h1a2 2 0 0 0 1.029-.285L8 5.532v6.936Zm6.586.775a2 2 0 0 0 2.828 0l1.414-1.415 1.415 1.415a2 2 0 1 0 2.828-2.829L21.657 9l1.414-1.414a2 2 0 0 0-2.828-2.829l-1.415 1.415-1.414-1.415a2 2 0 1 0-2.828 2.829L16 9l-1.414 1.414a2 2 0 0 0 0 2.829Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
