import * as React from "react";
import { SVGProps, Ref, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    ref={ref}
    {...props}
  >
    <g clipPath="url(#a)">
      <path
        fill="#54B835"
        fillRule="evenodd"
        d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16ZM6.276 7.098a1.333 1.333 0 0 0-1.885 1.885l1.885 1.886c.52.52 1.365.52 1.886 0l3.3-3.3a1.333 1.333 0 1 0-1.886-1.886L7.219 8.04l-.943-.942Z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
