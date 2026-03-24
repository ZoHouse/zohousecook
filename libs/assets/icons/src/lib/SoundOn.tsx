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
      fill={props.fill || "#fff"}
      fillRule="evenodd"
      d="M10.985 18.711A2 2 0 0 0 12 16.971v-14a2 2 0 0 0-3.029-1.715L4.446 3.97H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.446l4.525 2.715a2 2 0 0 0 2.014.025ZM8 13.438l-1.971-1.182A2 2 0 0 0 5 11.97H4v-4h1a2 2 0 0 0 1.029-.285L8 6.503v6.935Zm8 .533a2 2 0 0 0 2-2v-4a2 2 0 1 0-4 0v4a2 2 0 0 0 2 2Zm8 0a2 2 0 1 1-4 0v-8a2 2 0 1 1 4 0v8Z"
      clipRule="evenodd"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
