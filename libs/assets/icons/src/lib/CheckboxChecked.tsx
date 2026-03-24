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
    <g clipPath="url(#a)">
      <path
        fill={props.fill || "#5a5a5a"}
        fillRule="evenodd"
        d="M1.172 1.172C0 2.343 0 4.229 0 8v8c0 3.771 0 5.657 1.172 6.828C2.343 24 4.229 24 8 24h8c3.771 0 5.657 0 6.828-1.172C24 21.657 24 19.771 24 16V8c0-3.771 0-5.657-1.172-6.828C21.657 0 19.771 0 16 0H8C4.229 0 2.343 0 1.172 1.172Zm8.242 9.474a2 2 0 0 0-2.828 2.829l2.828 2.828a2 2 0 0 0 2.829 0l4.95-4.95a2 2 0 0 0-2.829-2.828l-3.536 3.536-1.414-1.415Z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h24v24H0z" />
      </clipPath>
    </defs>
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
