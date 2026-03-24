import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="33"
    height="30"
    viewBox="0 0 33 30"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      d="m9.219 27.126 7.792-9.805h5.94l-7.792 9.805h-5.94Zm0 2.873v-2.874l3.48-1.213h10.06v4.087H9.22Zm.574-11.432v-4.088h13.158v2.842l-3.45 1.246H9.794ZM4.547 4.675H0V30h4.547V4.675ZM27.783 4.594V0H4.5v4.594h23.283ZM32.33 4.627h-4.547V30h4.547V4.627Z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
