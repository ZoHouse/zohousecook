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
      d="m10.357 4.7.942-.943.943.943-.943.943zM7.53 7.529l.942-.943.942.943-.942.942zM5.643 9.414l.942-.942.943.942-.943.943zM3.757 11.3l.943-.942.942.942-.942.943zM10.357 7.529l.943-.943.942.943-.942.942zM7.529 4.7l.942-.943.943.943-.943.942zM10.357 10.357l.943-.943.942.943-.942.943zM4.7 4.7l.943-.942.942.942-.942.943z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
