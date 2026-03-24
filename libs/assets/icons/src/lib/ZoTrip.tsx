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
    viewBox="0 0 64 64"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      fillRule="evenodd"
      d="M32.026 19.68c4.19 0 7.587-3.51 7.587-7.84S36.217 4 32.026 4c-4.19 0-7.587 3.51-7.587 7.84s3.397 7.84 7.587 7.84ZM4 18.56V28.8h12.174a4.335 4.335 0 0 1 4.336 4.335V60h10.37V27.231a8.671 8.671 0 0 0-8.671-8.671H4ZM43.49 60V33.136a4.336 4.336 0 0 1 4.336-4.336H60V18.56H41.791a8.671 8.671 0 0 0-8.67 8.671V60h10.37Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
