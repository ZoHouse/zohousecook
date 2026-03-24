import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <g clipPath="url(#a)">
      <path
        fill={props.fill || "#5A5A5A"}
        fillRule="evenodd"
        d="M7.657 7.172a4 4 0 1 0 5.657 5.656 4 4 0 0 0-5.657-5.656Zm-2.829 8.485a8 8 0 1 1 12.55-1.593l3.007 3.007a2 2 0 1 1-2.829 2.828l-3.006-3.006a8.004 8.004 0 0 1-9.722-1.236Z"
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
