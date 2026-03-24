import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

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
    <path
      fill={props.fill || "#5a5a5a"}
      d="M5.333 1.333h5.333v1.333H5.333zM5.333 14.667h5.333v-1.333H5.333zM1.333 5.333h1.333v5.333H1.333zM13.333 5.333h1.333v5.333h-1.333zM2.667 4H4v1.333H2.667zM4 2.667h1.333V4H4zM2.667 12H4v-1.333H2.667zM4 13.333h1.333V12H4zM12 4h1.333v1.333H12zM10.667 2.667H12V4h-1.333zM12 12h1.333v-1.333H12zM10.667 13.333H12V12h-1.333zM7.333 7.333h1.333v1.333H7.333zM6 8.667h1.333V10H6zM10 8.667H8.667V10H10zM8.667 6H10v1.333H8.667zM7.333 6H6v1.333h1.333z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
