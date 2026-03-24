import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill="#FF2F8E"
      stroke="#121212"
      strokeWidth={4}
      d="M17.4 4.571 16 3.201l-1.4 1.37-2.372 2.324-3.32.034-1.959.02-.02 1.96-.034 3.32L4.57 14.6 3.201 16l1.37 1.4 2.324 2.372.034 3.32.02 1.959 1.96.02 3.32.034L14.6 27.43 16 28.799l1.4-1.37 2.372-2.324 3.32-.034 1.959-.02.02-1.96.034-3.32L27.43 17.4 28.799 16l-1.37-1.4-2.324-2.372-.034-3.32-.02-1.959-1.96-.02-3.32-.034L17.4 4.57Z"
    />
    <path
      fill="#fff"
      d="M15.502 18.174h3.385v1.972H12.83v-1.902l3.245-3.93h-3.217V12.34h5.959v1.903l-3.315 3.93Z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
